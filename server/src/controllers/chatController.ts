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
                        content: msg.isDeleted ? "Tin nhắn đã bị xóa" : decrypt(msg.content),
                        type: msg.type,
                        senderId: msg.senderId,
                        senderName: msg.sender.username,
                        createdAt: msg.createdAt
                    };
                }
            }

            // Calculate unread count - messages after lastReadMessageId from other users
            const unreadCount = p.lastReadMessageId
                ? await messageRepo.count({
                    where: {
                        conversationId: conv.id,
                        id: MoreThan(p.lastReadMessageId),
                        senderId: In(otherParticipants.map(op => op.userId))
                    }
                })
                : await messageRepo.count({
                    where: {
                        conversationId: conv.id,
                        senderId: In(otherParticipants.map(op => op.userId))
                    }
                });

            return {
                id: conv.id,
                name: conv.name,
                type: conv.type,
                participants: otherParticipants.map(op => ({
                    id: op.user.id,
                    username: op.user.username,
                    avatarUrl: op.user.avatarUrl
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

        if (!name || !participantIds || participantIds.length < 2) {
            return res.status(400).json({ error: "Group name and at least 2 participants required" });
        }

        // Create conversation
        const conversation = conversationRepo.create({
            type: "group",
            name
        });
        await conversationRepo.save(conversation);

        // Add creator + participants
        const allParticipants = [userId, ...participantIds];
        await participantRepo.save(
            allParticipants.map(uid => participantRepo.create({
                conversationId: conversation.id,
                userId: uid
            }))
        );

        // Emit to all participants
        const io = getIO();
        participantIds.forEach((pid: number) => {
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
            content: msg.isDeleted ? "Tin nhắn đã bị xóa" : decrypt(msg.content),
            type: msg.type,
            fileUrl: msg.fileUrl,
            fileName: msg.fileName,
            replyTo: msg.replyTo ? {
                id: msg.replyTo.id,
                content: msg.replyTo.isDeleted ? "Tin nhắn đã bị xóa" : decrypt(msg.replyTo.content),
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

        message.isDeleted = true;
        message.deletedAt = new Date();
        message.content = encrypt("Tin nhắn đã bị xóa");
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

        await participantRepo.update(
            { conversationId, userId },
            { lastReadMessageId: messageId, lastReadAt: new Date() }
        );

        // Emit read status
        const io = getIO();
        const participants = await participantRepo.find({ where: { conversationId } });

        participants.forEach(p => {
            if (p.userId !== userId) {
                io.to(`user_${p.userId}_web`).emit("chat:message_read", {
                    conversationId,
                    userId,
                    messageId
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
