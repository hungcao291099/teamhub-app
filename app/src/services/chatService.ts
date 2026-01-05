import axiosClient from '../api/axiosClient';

export interface Conversation {
    id: number;
    name: string | null;
    type: 'direct' | 'group';
    avatarUrl: string | null;
    lastMessageId: number | null;
    createdAt: string;
    updatedAt: string;
    participants?: any[];
    lastMessage?: Message;
    unreadCount?: number;
    otherParticipant?: {
        id: number;
        name: string;
        username: string;
    };
}

export interface Message {
    id: number;
    conversationId: number;
    senderId: number;
    content: string;
    type: 'text' | 'image' | 'file';
    fileUrl: string | null;
    fileName: string | null;
    replyToId: number | null;
    isEdited: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    sender?: {
        id: number;
        name: string;
        username: string;
    };
    replyTo?: Message | null;
    reactions?: any[];
}

export const chatService = {
    // Get all conversations for current user
    getConversations: async (): Promise<Conversation[]> => {
        try {
            const data = await axiosClient.get('/chat/conversations');
            return data as any;
        } catch (error) {
            console.error('[ChatService] Error getting conversations:', error);
            throw error;
        }
    },

    // Get or create 1-1 conversation with a user
    getOrCreateConversation: async (userId: number): Promise<Conversation> => {
        try {
            const data = await axiosClient.post('/chat/conversations', { userId });
            return data as any;
        } catch (error) {
            console.error('[ChatService] Error creating conversation:', error);
            throw error;
        }
    },

    // Create group conversation
    createGroupConversation: async (name: string, memberIds: number[]): Promise<Conversation> => {
        try {
            const data = await axiosClient.post('/chat/conversations/group', { name, memberIds });
            return data as any;
        } catch (error) {
            console.error('[ChatService] Error creating group:', error);
            throw error;
        }
    },

    // Get messages for a conversation
    getMessages: async (conversationId: number, limit = 50, before?: number): Promise<Message[]> => {
        try {
            let url = `/chat/conversations/${conversationId}/messages?limit=${limit}`;
            if (before) {
                url += `&before=${before}`;
            }
            const data = await axiosClient.get(url);
            return data as any;
        } catch (error) {
            console.error('[ChatService] Error getting messages:', error);
            throw error;
        }
    },

    // Send a message
    sendMessage: async (
        conversationId: number,
        content: string,
        type: 'text' | 'image' | 'file' = 'text',
        fileUrl?: string,
        fileName?: string,
        replyToId?: number
    ): Promise<Message> => {
        try {
            const data = await axiosClient.post('/chat/messages', {
                conversationId,
                content,
                type,
                fileUrl,
                fileName,
                replyToId,
            });
            return data as any;
        } catch (error) {
            console.error('[ChatService] Error sending message:', error);
            throw error;
        }
    },

    // Edit a message
    editMessage: async (messageId: number, content: string): Promise<Message> => {
        try {
            const data = await axiosClient.patch(`/chat/messages/${messageId}`, { content });
            return data as any;
        } catch (error) {
            console.error('[ChatService] Error editing message:', error);
            throw error;
        }
    },

    // Delete a message
    deleteMessage: async (messageId: number): Promise<void> => {
        try {
            await axiosClient.delete(`/chat/messages/${messageId}`);
        } catch (error) {
            console.error('[ChatService] Error deleting message:', error);
            throw error;
        }
    },

    // Mark messages as read
    markAsRead: async (conversationId: number, messageId: number): Promise<void> => {
        try {
            await axiosClient.post('/chat/messages/read', { conversationId, messageId });
        } catch (error) {
            console.error('[ChatService] Error marking as read:', error);
            throw error;
        }
    },

    // Get group info
    getGroupInfo: async (conversationId: number): Promise<any> => {
        try {
            const data = await axiosClient.get(`/chat/conversations/${conversationId}/info`);
            return data as any;
        } catch (error) {
            console.error('[ChatService] Error getting group info:', error);
            throw error;
        }
    },
};
