import axios from "./api";

export interface Message {
    id: number;
    conversationId: number;
    senderId: number;
    senderName: string;
    senderAvatarUrl: string | null;
    content: string;
    type: "text" | "image" | "file";
    fileUrl?: string | null;
    fileName?: string | null;
    replyTo?: {
        id: number;
        content: string;
        senderName: string;
    } | null;
    isEdited: boolean;
    isDeleted: boolean;
    reactions: Array<{
        id: number;
        emoji: string;
        userId: number;
        username: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

export interface Conversation {
    id: number;
    name: string | null;
    type: "direct" | "group";
    participants: Array<{
        id: number;
        username: string;
        avatarUrl: string | null;
    }>;
    lastMessage: {
        id: number;
        content: string;
        type: string;
        senderId: number;
        senderName: string;
        createdAt: string;
    } | null;
    unreadCount: number;
    updatedAt: string;
}

export const chatApi = {
    // Get all conversations
    getConversations: async (): Promise<Conversation[]> => {
        const response = await axios.get("/chat/conversations");
        return response.data;
    },

    // Get or create 1-1 conversation
    getOrCreateConversation: async (otherUserId: number): Promise<{ conversationId: number }> => {
        const response = await axios.post("/chat/conversations", { otherUserId });
        return response.data;
    },

    // Create group conversation
    createGroupConversation: async (name: string, participantIds: number[]): Promise<{ conversationId: number }> => {
        const response = await axios.post("/chat/conversations/group", { name, participantIds });
        return response.data;
    },

    // Get messages for a conversation
    getMessages: async (conversationId: number, page = 1): Promise<{
        messages: Message[];
        total: number;
        page: number;
        hasMore: boolean;
    }> => {
        const response = await axios.get(`/chat/conversations/${conversationId}/messages`, {
            params: { page }
        });
        return response.data;
    },

    // Send message
    sendMessage: async (data: {
        conversationId: number;
        content: string;
        type?: "text" | "image" | "file";
        fileUrl?: string;
        fileName?: string;
        replyToId?: number;
    }): Promise<Message> => {
        const response = await axios.post("/chat/messages", data);
        return response.data;
    },

    // Edit message
    editMessage: async (messageId: number, content: string): Promise<void> => {
        await axios.patch(`/chat/messages/${messageId}`, { content });
    },

    // Delete message
    deleteMessage: async (messageId: number): Promise<void> => {
        await axios.delete(`/chat/messages/${messageId}`);
    },

    // Mark as read
    markAsRead: async (conversationId: number, messageId: number): Promise<void> => {
        await axios.post("/chat/messages/read", { conversationId, messageId });
    },

    // Add reaction
    addReaction: async (messageId: number, emoji: string): Promise<void> => {
        await axios.post(`/chat/messages/${messageId}/reactions`, { emoji });
    },

    // Remove reaction
    removeReaction: async (messageId: number, emoji: string): Promise<void> => {
        await axios.delete(`/chat/messages/${messageId}/reactions`, { data: { emoji } });
    },

    uploadFile: async (file: File): Promise<{
        fileUrl: string;
        fileName: string;
        fileSize: number;
        mimeType: string;
    }> => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await axios.post("/chat/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        return response.data;
    },

    // Group management
    getGroupInfo: async (conversationId: number): Promise<{
        id: number;
        name: string | null;
        type: "direct" | "group";
        createdAt: string;
        participants: Array<{
            id: number;
            userId: number;
            username: string;
            name: string | null;
            avatarUrl: string | null;
            role: "owner" | "admin" | "member";
            joinedAt: string;
        }>;
        currentUserRole: "owner" | "admin" | "member";
    }> => {
        const response = await axios.get(`/chat/conversations/${conversationId}/info`);
        return response.data;
    },

    addGroupMember: async (conversationId: number, userIds: number[]): Promise<void> => {
        await axios.post(`/chat/conversations/${conversationId}/members`, { userIds });
    },

    removeGroupMember: async (conversationId: number, userId: number): Promise<void> => {
        await axios.delete(`/chat/conversations/${conversationId}/members/${userId}`);
    },

    updateMemberRole: async (conversationId: number, userId: number, role: "admin" | "member"): Promise<void> => {
        await axios.patch(`/chat/conversations/${conversationId}/members/${userId}/role`, { role });
    },

    transferOwnership: async (conversationId: number, newOwnerId: number): Promise<void> => {
        await axios.post(`/chat/conversations/${conversationId}/transfer-ownership`, { newOwnerId });
    },

    deleteGroup: async (conversationId: number): Promise<void> => {
        await axios.delete(`/chat/conversations/${conversationId}`);
    },
};
