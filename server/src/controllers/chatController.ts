import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Conversation } from "../entities/Conversation";
import { Message } from "../entities/Message";
import { ConversationParticipant } from "../entities/ConversationParticipant";
import { MessageReaction } from "../entities/MessageReaction";
import { User } from "../entities/User";
import { encrypt, decrypt } from "../utils/encryption";
import { getIO } from "../socket";
import { In, MoreThan } from "typeorm";
import * as fs from "fs";
import * as path from "path";

const conversationRepo = AppDataSource.getRepository(Conversation);
const messageRepo = AppDataSource.getRepository(Message);
const participantRepo = AppDataSource.getRepository(ConversationParticipant);
const reactionRepo = AppDataSource.getRepository(MessageReaction);
const userRepo = AppDataSource.getRepository(User);

// Get all conversations for logged-in user
export const getConversations = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const participants = await participantRepo.find({
            where: { userId },
            relations: ["conversation", "conversation.participants", "conversation.participants.user"],
            order: { conversation: { updatedAt: "DESC" } }
        });

        const conversations = await Promise.all(participants.map(async (p) => {
            const conv = p.conversation;

            // Get other participants for display name/avatar
            const otherParticipants = conv.participants.filter(cp => cp.userId !== userId);

            // Get last message
            let lastMessage = null;
            if (conv.lastMessageId) {
                const msg = await messageRepo.findOne({
                    where: { id: conv.lastMessageId },
                    relations: ["sender"]
                });
                if (msg) {
                    lastMessage = {
                        id: msg.id,
                        content: msg.isDeleted ? "" : decrypt(msg.content),
                        type: msg.type,
                        senderId: msg.senderId,
                        senderName: msg.sender.username,
                        createdAt: msg.createdAt
                    };
                }
            }

            // Calculate unread count - messages after lastReadMessageId from other users
            // Skip if no other participants (would cause SQL error with empty In())
            let unreadCount = 0;
            if (otherParticipants.length > 0) {
                const otherUserIds = otherParticipants.map(op => op.userId);

                if (p.lastReadMessageId) {
                    // Find unread messages with details
                    const unreadMessages = await messageRepo.find({
                        where: {
                            conversationId: conv.id,
                            id: MoreThan(p.lastReadMessageId),
                            senderId: In(otherUserIds)
                        },
                        select: ['id', 'senderId']
                    });
                    unreadCount = unreadMessages.length;

                    if (unreadCount > 0) {
                        console.log(`[getConversations] Conv ${conv.id}: Unread messages:`, unreadMessages.map(m => ({ id: m.id, senderId: m.senderId })));
                    }
                } else {
                    unreadCount = await messageRepo.count({
                        where: {
                            conversationId: conv.id,
                            senderId: In(otherUserIds)
                        }
                    });
                }

                console.log(`[getConversations] Conv ${conv.id}: lastReadMessageId=${p.lastReadMessageId}, unreadCount=${unreadCount}, otherUserIds=${otherUserIds.join(',')}`);
            }

            return {
                id: conv.id,
                name: conv.name,
                avatarUrl: conv.avatarUrl,
                type: conv.type,
                participants: otherParticipants.map(op => ({
                    id: op.user.id,
                    username: op.user.username,
                    name: op.user.name,
                    avatarUrl: op.user.avatarUrl,
                    selectedFrame: op.user.selectedFrame
                })),
                lastMessage,
                unreadCount,
                updatedAt: conv.updatedAt
            };
        }));

        res.json(conversations);
    } catch (error) {
        console.error("Error getting conversations:", error);
        res.status(500).json({ error: "Failed to get conversations" });
    }
};

// Get or create 1-1 conversation
export const getOrCreateConversation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { otherUserId } = req.body;

        if (!otherUserId) {
            return res.status(400).json({ error: "otherUserId is required" });
        }

        // Check if conversation already exists
        const existingParticipants = await participantRepo.find({
            where: { userId },
            relations: ["conversation", "conversation.participants"]
        });

        for (const p of existingParticipants) {
            const conv = p.conversation;
            if (conv.type === "direct" && conv.participants.length === 2) {
                const hasOtherUser = conv.participants.some(cp => cp.userId === otherUserId);
                if (hasOtherUser) {
                    return res.json({ conversationId: conv.id });
                }
            }
        }

        // Create new conversation
        const conversation = conversationRepo.create({
            type: "direct",
            name: null
        });
        await conversationRepo.save(conversation);

        // Add participants
        await participantRepo.save([
            participantRepo.create({ conversationId: conversation.id, userId }),
            participantRepo.create({ conversationId: conversation.id, userId: otherUserId })
        ]);

        // Emit to other user
        const io = getIO();
        io.to(`user_${otherUserId}_web`).emit("chat:conversation_created", {
            conversationId: conversation.id
        });

        res.json({ conversationId: conversation.id });
    } catch (error) {
        console.error("Error creating conversation:", error);
        res.status(500).json({ error: "Failed to create conversation" });
    }
};

// Create group conversation
export const createGroupConversation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { name, participantIds } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Group name is required" });
        }

        // Ensure participantIds is an array (can be empty)
        const memberIds = Array.isArray(participantIds) ? participantIds : [];

        // Create conversation
        const conversation = conversationRepo.create({
            type: "group",
            name
        });
        await conversationRepo.save(conversation);


        // Add creator as owner + participants as members
        const creatorParticipant = participantRepo.create({
            conversationId: conversation.id,
            userId: userId,
            role: "owner"
        });

        const memberParticipants = memberIds.map((pid: number) => participantRepo.create({
            conversationId: conversation.id,
            userId: pid,
            role: "member"
        }));

        await participantRepo.save([creatorParticipant, ...memberParticipants]);


        // Emit to all participants
        const io = getIO();
        memberIds.forEach((pid: number) => {
            io.to(`user_${pid}_web`).emit("chat:conversation_created", {
                conversationId: conversation.id
            });
        });

        res.json({ conversationId: conversation.id });
    } catch (error) {
        console.error("Error creating group:", error);
        res.status(500).json({ error: "Failed to create group" });
    }
};

// Get messages for a conversation
export const getMessages = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { conversationId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = 50;

        // Verify user is participant
        const participant = await participantRepo.findOne({
            where: { conversationId: parseInt(conversationId), userId }
        });

        if (!participant) {
            return res.status(403).json({ error: "Not authorized" });
        }

        // Get messages with pagination
        const [messages, total] = await messageRepo.findAndCount({
            where: { conversationId: parseInt(conversationId) },
            relations: ["sender", "reactions", "reactions.user", "replyTo", "replyTo.sender"],
            order: { createdAt: "DESC" },
            skip: (page - 1) * limit,
            take: limit
        });

        const decryptedMessages = messages.map(msg => ({
            id: msg.id,
            conversationId: msg.conversationId,
            senderId: msg.senderId,
            senderName: msg.sender.username,
            senderAvatarUrl: msg.sender.avatarUrl,
            senderSelectedFrame: msg.sender.selectedFrame,
            content: msg.isDeleted ? "" : decrypt(msg.content),
            type: msg.type,
            fileUrl: msg.fileUrl,
            fileName: msg.fileName,
            replyTo: msg.replyTo ? {
                id: msg.replyTo.id,
                content: msg.replyTo.isDeleted ? "" : decrypt(msg.replyTo.content),
                senderName: msg.replyTo.sender.username
            } : null,
            isEdited: msg.isEdited,
            isDeleted: msg.isDeleted,
            reactions: msg.reactions.map(r => ({
                id: r.id,
                emoji: r.emoji,
                userId: r.userId,
                username: r.user.username
            })),
            createdAt: msg.createdAt,
            updatedAt: msg.updatedAt
        }));

        res.json({
            messages: decryptedMessages.reverse(), // Oldest first
            total,
            page,
            hasMore: total > page * limit
        });
    } catch (error) {
        console.error("Error getting messages:", error);
        res.status(500).json({ error: "Failed to get messages" });
    }
};

// Send message
export const sendMessage = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { conversationId, content, type = "text", fileUrl, fileName, replyToId } = req.body;

        // Verify participant
        const participant = await participantRepo.findOne({
            where: { conversationId, userId }
        });

        if (!participant) {
            return res.status(403).json({ error: "Not authorized" });
        }

        // Encrypt content
        const encryptedContent = encrypt(content);

        // Create message
        const message = messageRepo.create({
            conversationId,
            senderId: userId,
            content: encryptedContent,
            type,
            fileUrl,
            fileName,
            replyToId
        });
        await messageRepo.save(message);

        // Update conversation lastMessageId
        await conversationRepo.update(conversationId, {
            lastMessageId: message.id,
            updatedAt: new Date()
        });

        // Load full message with relations
        const fullMessage = await messageRepo.findOne({
            where: { id: message.id },
            relations: ["sender", "replyTo", "replyTo.sender"]
        });

        // Emit to conversation participants
        const io = getIO();
        const participants = await participantRepo.find({ where: { conversationId } });

        const messageData = {
            id: fullMessage!.id,
            conversationId: fullMessage!.conversationId,
            senderId: fullMessage!.senderId,
            senderName: fullMessage!.sender.username,
            senderAvatarUrl: fullMessage!.sender.avatarUrl,
            senderSelectedFrame: fullMessage!.sender.selectedFrame,
            content: decrypt(fullMessage!.content),
            type: fullMessage!.type,
            fileUrl: fullMessage!.fileUrl,
            fileName: fullMessage!.fileName,
            replyTo: fullMessage!.replyTo ? {
                id: fullMessage!.replyTo.id,
                content: decrypt(fullMessage!.replyTo.content),
                senderName: fullMessage!.replyTo.sender.username
            } : null,
            isEdited: false,
            isDeleted: false,
            reactions: [],
            createdAt: fullMessage!.createdAt,
            updatedAt: fullMessage!.updatedAt
        };

        participants.forEach(p => {
            io.to(`user_${p.userId}_web`).emit("chat:message", messageData);
        });

        res.json(messageData);
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Failed to send message" });
    }
};

// Edit message
export const editMessage = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { messageId } = req.params;
        const { content } = req.body;

        const message = await messageRepo.findOne({
            where: { id: parseInt(messageId) },
            relations: ["conversation", "conversation.participants"]
        });

        if (!message || message.senderId !== userId) {
            return res.status(403).json({ error: "Not authorized" });
        }

        // Encrypt new content
        message.content = encrypt(content);
        message.isEdited = true;
        await messageRepo.save(message);

        // Emit to participants
        const io = getIO();
        message.conversation.participants.forEach(p => {
            io.to(`user_${p.userId}_web`).emit("chat:message_edited", {
                messageId: message.id,
                content: decrypt(message.content),
                isEdited: true
            });
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Error editing message:", error);
        res.status(500).json({ error: "Failed to edit message" });
    }
};

// Delete message
export const deleteMessage = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { messageId } = req.params;

        const message = await messageRepo.findOne({
            where: { id: parseInt(messageId) },
            relations: ["conversation", "conversation.participants"]
        });

        if (!message || message.senderId !== userId) {
            return res.status(403).json({ error: "Not authorized" });
        }

        // Delete physical file if message has an attachment
        if (message.fileUrl) {
            try {
                // Extract filename from URL (/uploads/chat/filename.ext)
                const filename = message.fileUrl.split('/').pop();
                if (filename) {
                    const filePath = path.join(__dirname, '../../public/uploads/chat', filename);

                    // Delete file if it exists
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        console.log(`Deleted file: ${filePath}`);
                    }
                }
            } catch (error) {
                // Log error but continue with message deletion
                console.error('Error deleting file:', error);
            }
        }

        message.isDeleted = true;
        message.deletedAt = new Date();
        message.content = ""; // Empty content to save storage
        await messageRepo.save(message);

        // Emit to participants
        const io = getIO();
        message.conversation.participants.forEach(p => {
            io.to(`user_${p.userId}_web`).emit("chat:message_deleted", {
                messageId: message.id
            });
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({ error: "Failed to delete message" });
    }
};

// Mark messages as read
export const markAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { conversationId, messageId } = req.body;

        console.log('[markAsRead] Called with:', { userId, conversationId, messageId });

        if (!conversationId || !messageId) {
            console.log('[markAsRead] Missing conversationId or messageId');
            return res.status(400).json({ error: "conversationId and messageId are required" });
        }

        // Ensure messageId is a number
        const msgId = parseInt(messageId, 10);
        const convId = parseInt(conversationId, 10);

        if (isNaN(msgId) || isNaN(convId)) {
            console.log('[markAsRead] Invalid conversationId or messageId (NaN)');
            return res.status(400).json({ error: "Invalid conversationId or messageId" });
        }

        // Find the participant entry
        const participant = await participantRepo.findOne({
            where: { conversationId: convId, userId }
        });

        if (!participant) {
            console.log('[markAsRead] Participant not found:', { convId, userId });
            return res.status(404).json({ error: "Participant not found" });
        }

        console.log('[markAsRead] Current lastReadMessageId:', participant.lastReadMessageId);

        // Update only if the new messageId is greater than current (avoid going backwards)
        if (!participant.lastReadMessageId || msgId > participant.lastReadMessageId) {
            await participantRepo.update(
                { conversationId: convId, userId },
                { lastReadMessageId: msgId, lastReadAt: new Date() }
            );
            console.log('[markAsRead] Updated lastReadMessageId to:', msgId);
        } else {
            console.log('[markAsRead] Skipped update - msgId not greater than current');
        }

        // Emit read status
        const io = getIO();
        const participants = await participantRepo.find({ where: { conversationId: convId } });

        participants.forEach(p => {
            if (p.userId !== userId) {
                io.to(`user_${p.userId}_web`).emit("chat:message_read", {
                    conversationId: convId,
                    userId,
                    messageId: msgId
                });
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Error marking as read:", error);
        res.status(500).json({ error: "Failed to mark as read" });
    }
};

// Add reaction
export const addReaction = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { messageId } = req.params;
        const { emoji } = req.body;

        // Check if reaction already exists
        const existing = await reactionRepo.findOne({
            where: { messageId: parseInt(messageId), userId, emoji }
        });

        if (existing) {
            return res.json({ success: true });
        }

        const reaction = reactionRepo.create({
            messageId: parseInt(messageId),
            userId,
            emoji
        });
        await reactionRepo.save(reaction);

        // Get message conversation
        const message = await messageRepo.findOne({
            where: { id: parseInt(messageId) },
            relations: ["conversation", "conversation.participants"]
        });

        // Emit to participants
        const io = getIO();
        const user = await userRepo.findOne({ where: { id: userId } });

        message!.conversation.participants.forEach(p => {
            io.to(`user_${p.userId}_web`).emit("chat:reaction", {
                messageId: parseInt(messageId),
                reaction: {
                    id: reaction.id,
                    emoji: reaction.emoji,
                    userId: reaction.userId,
                    username: user!.username
                }
            });
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Error adding reaction:", error);
        res.status(500).json({ error: "Failed to add reaction" });
    }
};

// Remove reaction
export const removeReaction = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { messageId } = req.params;
        const { emoji } = req.body;

        const reaction = await reactionRepo.findOne({
            where: { messageId: parseInt(messageId), userId, emoji }
        });

        if (!reaction) {
            return res.status(404).json({ error: "Reaction not found" });
        }

        await reactionRepo.remove(reaction);

        // Get message conversation
        const message = await messageRepo.findOne({
            where: { id: parseInt(messageId) },
            relations: ["conversation", "conversation.participants"]
        });

        // Emit to participants
        const io = getIO();
        message!.conversation.participants.forEach(p => {
            io.to(`user_${p.userId}_web`).emit("chat:reaction_removed", {
                messageId: parseInt(messageId),
                reactionId: reaction.id
            });
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Error removing reaction:", error);
        res.status(500).json({ error: "Failed to remove reaction" });
    }
};

// Get group info with participants and their roles
export const getGroupInfo = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { conversationId } = req.params;

        // Verify user is a participant
        const userParticipant = await participantRepo.findOne({
            where: { conversationId: parseInt(conversationId), userId }
        });

        if (!userParticipant) {
            return res.status(403).json({ error: "Not authorized" });
        }

        // Get conversation with all participants
        const conversation = await conversationRepo.findOne({
            where: { id: parseInt(conversationId) },
            relations: ["participants", "participants.user"]
        });

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        // Check if there's an owner in the group (only for group conversations)
        if (conversation.type === "group") {
            const hasOwner = conversation.participants.some(p => p.role === "owner");

            // If no owner exists, assign the first participant as owner
            if (!hasOwner && conversation.participants.length > 0) {
                const firstParticipant = conversation.participants[0];
                firstParticipant.role = "owner";
                await participantRepo.save(firstParticipant);

                // Update userParticipant if it's the first one
                if (userParticipant.id === firstParticipant.id) {
                    userParticipant.role = "owner";
                }

                // Emit role update to all participants
                const io = getIO();
                conversation.participants.forEach(p => {
                    io.to(`user_${p.userId}_web`).emit("chat:role_updated", {
                        conversationId: conversation.id,
                        userId: firstParticipant.userId,
                        role: "owner",
                        updatedBy: null // System update
                    });
                });
            }
        }

        const participants = conversation.participants.map(p => ({
            id: p.id,
            userId: p.user.id,
            username: p.user.username,
            name: p.user.name,
            avatarUrl: p.user.avatarUrl,
            selectedFrame: p.user.selectedFrame,
            role: p.role,
            joinedAt: p.joinedAt
        }));

        res.json({
            id: conversation.id,
            name: conversation.name,
            avatarUrl: conversation.avatarUrl,
            type: conversation.type,
            createdAt: conversation.createdAt,
            participants,
            currentUserRole: userParticipant.role
        });
    } catch (error) {
        console.error("Error getting group info:", error);
        res.status(500).json({ error: "Failed to get group info" });
    }
};

// Add member to group (admin or owner only)
export const addGroupMember = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { conversationId } = req.params;
        const { userIds } = req.body;

        if (!userIds || userIds.length === 0) {
            return res.status(400).json({ error: "userIds is required" });
        }

        // Verify requester is admin or owner
        const requester = await participantRepo.findOne({
            where: { conversationId: parseInt(conversationId), userId }
        });

        if (!requester || (requester.role !== "admin" && requester.role !== "owner")) {
            return res.status(403).json({ error: "Only admins and owners can add members" });
        }

        // Check if users are already participants
        const existingParticipants = await participantRepo.find({
            where: {
                conversationId: parseInt(conversationId),
                userId: In(userIds)
            }
        });

        const existingUserIds = existingParticipants.map(p => p.userId);
        const newUserIds = userIds.filter((id: number) => !existingUserIds.includes(id));

        if (newUserIds.length === 0) {
            return res.status(400).json({ error: "All users are already members" });
        }

        // Add new participants
        const newParticipants = newUserIds.map((uid: number) => participantRepo.create({
            conversationId: parseInt(conversationId),
            userId: uid,
            role: "member"
        }));

        await participantRepo.save(newParticipants);

        // Get user details for response
        const users = await userRepo.find({
            where: { id: In(newUserIds) }
        });

        // Emit to all participants including new ones
        const io = getIO();
        const allParticipants = await participantRepo.find({
            where: { conversationId: parseInt(conversationId) }
        });

        const memberData = users.map(user => ({
            userId: user.id,
            username: user.username,
            name: user.name,
            avatarUrl: user.avatarUrl,
            role: "member"
        }));

        allParticipants.forEach(p => {
            io.to(`user_${p.userId}_web`).emit("chat:member_added", {
                conversationId: parseInt(conversationId),
                members: memberData,
                addedBy: userId
            });
        });

        res.json({ success: true, members: memberData });
    } catch (error) {
        console.error("Error adding group member:", error);
        res.status(500).json({ error: "Failed to add member" });
    }
};

// Remove member from group (admin or owner only)
export const removeGroupMember = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { conversationId, targetUserId } = req.params;

        // Verify requester is admin or owner
        const requester = await participantRepo.findOne({
            where: { conversationId: parseInt(conversationId), userId }
        });

        if (!requester || (requester.role !== "admin" && requester.role !== "owner")) {
            return res.status(403).json({ error: "Only admins and owners can remove members" });
        }

        // Get target participant
        const targetParticipant = await participantRepo.findOne({
            where: { conversationId: parseInt(conversationId), userId: parseInt(targetUserId) }
        });

        if (!targetParticipant) {
            return res.status(404).json({ error: "User is not a member" });
        }

        // Prevent removing the owner
        if (targetParticipant.role === "owner") {
            return res.status(403).json({ error: "Cannot remove the owner" });
        }

        // Admins cannot remove other admins, only owner can
        if (requester.role === "admin" && targetParticipant.role === "admin") {
            return res.status(403).json({ error: "Admins cannot remove other admins" });
        }

        // Remove participant
        await participantRepo.remove(targetParticipant);

        // Emit to all participants
        const io = getIO();
        const allParticipants = await participantRepo.find({
            where: { conversationId: parseInt(conversationId) }
        });

        allParticipants.forEach(p => {
            io.to(`user_${p.userId}_web`).emit("chat:member_removed", {
                conversationId: parseInt(conversationId),
                userId: parseInt(targetUserId),
                removedBy: userId
            });
        });

        // Also notify the removed user
        io.to(`user_${targetUserId}_web`).emit("chat:member_removed", {
            conversationId: parseInt(conversationId),
            userId: parseInt(targetUserId),
            removedBy: userId
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Error removing group member:", error);
        res.status(500).json({ error: "Failed to remove member" });
    }
};

// Update member role (owner only)
export const updateMemberRole = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { conversationId, targetUserId } = req.params;
        const { role } = req.body;

        if (!["admin", "member"].includes(role)) {
            return res.status(400).json({ error: "Invalid role. Must be 'admin' or 'member'" });
        }

        // Verify requester is owner
        const requester = await participantRepo.findOne({
            where: { conversationId: parseInt(conversationId), userId }
        });

        if (!requester || requester.role !== "owner") {
            return res.status(403).json({ error: "Only the owner can update member roles" });
        }

        // Get target participant
        const targetParticipant = await participantRepo.findOne({
            where: { conversationId: parseInt(conversationId), userId: parseInt(targetUserId) }
        });

        if (!targetParticipant) {
            return res.status(404).json({ error: "User is not a member" });
        }

        // Prevent changing owner role (use transfer ownership instead)
        if (targetParticipant.role === "owner") {
            return res.status(403).json({ error: "Cannot change owner role. Use transfer ownership instead" });
        }

        // Update role
        targetParticipant.role = role as "admin" | "member";
        await participantRepo.save(targetParticipant);

        // Emit to all participants
        const io = getIO();
        const allParticipants = await participantRepo.find({
            where: { conversationId: parseInt(conversationId) }
        });

        allParticipants.forEach(p => {
            io.to(`user_${p.userId}_web`).emit("chat:role_updated", {
                conversationId: parseInt(conversationId),
                userId: parseInt(targetUserId),
                role,
                updatedBy: userId
            });
        });

        res.json({ success: true, role });
    } catch (error) {
        console.error("Error updating member role:", error);
        res.status(500).json({ error: "Failed to update role" });
    }
};

// Transfer ownership (owner only)
export const transferOwnership = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { conversationId } = req.params;
        const { newOwnerId } = req.body;

        if (!newOwnerId) {
            return res.status(400).json({ error: "newOwnerId is required" });
        }

        // Verify requester is current owner
        const currentOwner = await participantRepo.findOne({
            where: { conversationId: parseInt(conversationId), userId }
        });

        if (!currentOwner || currentOwner.role !== "owner") {
            return res.status(403).json({ error: "Only the owner can transfer ownership" });
        }

        // Get new owner participant
        const newOwner = await participantRepo.findOne({
            where: { conversationId: parseInt(conversationId), userId: newOwnerId }
        });

        if (!newOwner) {
            return res.status(404).json({ error: "Target user is not a member" });
        }

        // Update roles
        currentOwner.role = "admin";
        newOwner.role = "owner";

        await participantRepo.save([currentOwner, newOwner]);

        // Emit to all participants
        const io = getIO();
        const allParticipants = await participantRepo.find({
            where: { conversationId: parseInt(conversationId) }
        });

        allParticipants.forEach(p => {
            io.to(`user_${p.userId}_web`).emit("chat:ownership_transferred", {
                conversationId: parseInt(conversationId),
                oldOwnerId: userId,
                newOwnerId
            });
        });

        res.json({ success: true });
    } catch (error) {
        console.error("Error transferring ownership:", error);
        res.status(500).json({ error: "Failed to transfer ownership" });
    }
};

// Delete group (owner only)
export const deleteGroup = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { conversationId } = req.params;

        // Verify requester is owner
        const requester = await participantRepo.findOne({
            where: { conversationId: parseInt(conversationId), userId }
        });

        if (!requester || requester.role !== "owner") {
            return res.status(403).json({ error: "Only the owner can delete the group" });
        }

        // Get all participants for notification
        const allParticipants = await participantRepo.find({
            where: { conversationId: parseInt(conversationId) }
        });

        // Emit deletion event before deleting
        const io = getIO();
        allParticipants.forEach(p => {
            io.to(`user_${p.userId}_web`).emit("chat:group_deleted", {
                conversationId: parseInt(conversationId),
                deletedBy: userId
            });
        });

        // Delete all messages (reactions will be cascade deleted)
        await messageRepo.delete({ conversationId: parseInt(conversationId) });

        // Delete all participants
        await participantRepo.delete({ conversationId: parseInt(conversationId) });

        // Delete conversation
        await conversationRepo.delete(parseInt(conversationId));

        res.json({ success: true });
    } catch (error) {
        console.error("Error deleting group:", error);
        res.status(500).json({ error: "Failed to delete group" });
    }
};

// Update group name and avatar (owner or admin only)
export const updateGroup = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { conversationId } = req.params;
        const { name, avatarUrl } = req.body;

        // Verify requester is admin or owner
        const requester = await participantRepo.findOne({
            where: { conversationId: parseInt(conversationId), userId }
        });

        if (!requester || (requester.role !== "admin" && requester.role !== "owner")) {
            return res.status(403).json({ error: "Only admins and owners can update the group" });
        }

        // Get conversation
        const conversation = await conversationRepo.findOne({
            where: { id: parseInt(conversationId) }
        });

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        if (conversation.type !== "group") {
            return res.status(400).json({ error: "Can only update group conversations" });
        }

        // Update fields
        if (name !== undefined) {
            conversation.name = name;
        }
        if (avatarUrl !== undefined) {
            conversation.avatarUrl = avatarUrl;
        }

        await conversationRepo.save(conversation);

        // Emit to all participants
        const io = getIO();
        const allParticipants = await participantRepo.find({
            where: { conversationId: parseInt(conversationId) }
        });

        allParticipants.forEach(p => {
            io.to(`user_${p.userId}_web`).emit("chat:group_updated", {
                conversationId: parseInt(conversationId),
                name: conversation.name,
                avatarUrl: conversation.avatarUrl,
                updatedBy: userId
            });
        });

        res.json({
            success: true,
            name: conversation.name,
            avatarUrl: conversation.avatarUrl
        });
    } catch (error) {
        console.error("Error updating group:", error);
        res.status(500).json({ error: "Failed to update group" });
    }
};

// Music Chat - Special shared conversation for all users
const MUSIC_CHAT_NAME = "🎵 Music Live Chat";

export const getMusicChatConversation = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        console.log("[MusicChat] Getting music chat for user:", userId);

        // Find existing Music Chat conversation
        let musicChat = await conversationRepo.findOne({
            where: { name: MUSIC_CHAT_NAME, type: "group" }
        });

        // Create if not exists
        if (!musicChat) {
            musicChat = conversationRepo.create({
                name: MUSIC_CHAT_NAME,
                type: "group",
                avatarUrl: null
            });
            await conversationRepo.save(musicChat);
            console.log("[MusicChat] Created new Music Chat conversation:", musicChat.id);
        }

        // Check if user is already a participant
        let userParticipant = await participantRepo.findOne({
            where: { conversationId: musicChat.id, userId }
        });

        // Auto-join user if not participant
        if (!userParticipant) {
            userParticipant = participantRepo.create({
                conversationId: musicChat.id,
                userId,
                role: "member"
            });
            await participantRepo.save(userParticipant);
            console.log("[MusicChat] User", userId, "joined Music Chat");
        }

        // Load all participants with user info
        const allParticipants = await participantRepo.find({
            where: { conversationId: musicChat.id },
            relations: ["user"]
        });

        // Get participant info for response - with null safety
        const participants = allParticipants
            .filter(p => p.user != null) // Filter out any participants without user loaded
            .map(p => ({
                id: p.user.id,
                username: p.user.username,
                name: p.user.name,
                avatarUrl: p.user.avatarUrl
            }));

        console.log("[MusicChat] Returning", participants.length, "participants");

        res.json({
            conversationId: musicChat.id,
            name: musicChat.name,
            participants,
            participantCount: participants.length
        });
    } catch (error: any) {
        console.error("[MusicChat] Error getting music chat:", error?.message || error);
        console.error("[MusicChat] Stack:", error?.stack);
        res.status(500).json({ error: "Failed to get music chat", details: error?.message });
    }
};
