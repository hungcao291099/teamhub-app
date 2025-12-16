import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { chatApi, Conversation, Message } from "@/services/chatApi";
import { useAuth } from "@/hooks/useAuth";

interface ChatContextType {
    socket: Socket | null;
    conversations: Conversation[];
    activeConversationId: number | null;
    messages: Message[];
    typingUsers: Map<number, string[]>; // conversationId => usernames[]
    unreadTotal: number;
    isLoading: boolean;
    isChatDialogOpen: boolean;

    // Actions
    setActiveConversation: (id: number | null) => void;
    setChatDialogOpen: (open: boolean) => void;
    sendMessage: (content: string, type?: "text" | "image" | "file", fileUrl?: string, fileName?: string, replyToId?: number) => Promise<void>;
    editMessage: (messageId: number, content: string) => Promise<void>;
    deleteMessage: (messageId: number) => Promise<void>;
    addReaction: (messageId: number, emoji: string) => Promise<void>;
    removeReaction: (messageId: number, emoji: string) => Promise<void>;
    markAsRead: (conversationId: number, messageId: number) => Promise<void>;
    loadMoreMessages: () => Promise<void>;
    startTyping: (conversationId: number) => void;
    stopTyping: (conversationId: number) => void;
    refreshConversations: () => Promise<void>;
    createConversation: (otherUserId: number) => Promise<number>;
    createGroupConversation: (name: string, participantIds: number[]) => Promise<number>;
    uploadFile: (file: File) => Promise<{ fileUrl: string; fileName: string }>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within ChatProvider");
    }
    return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const auth = useAuth();
    const user = auth?.currentUser;
    const token = localStorage.getItem("token");
    const [socket, setSocket] = useState<Socket | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [typingUsers, setTypingUsers] = useState<Map<number, string[]>>(new Map());
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
    const typingTimeoutRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

    // Use ref to avoid stale closure in socket event handlers
    const activeConversationRef = useRef<number | null>(null);

    // Keep ref in sync with state
    useEffect(() => {
        activeConversationRef.current = activeConversationId;
    }, [activeConversationId]);

    // Calculate total unread
    const unreadTotal = Array.isArray(conversations)
        ? conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0)
        : 0;

    // Initialize socket connection
    useEffect(() => {
        if (!token || !user) return;

        const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:3001", {
            auth: { token },
            query: { clientType: "web" }
        });

        newSocket.on("connect", () => {
            console.log("Chat socket connected");
        });

        newSocket.on("disconnect", () => {
            console.log("Chat socket disconnected");
        });

        // Chat events
        newSocket.on("chat:message", (message: Message) => {
            console.log("Received chat:message", message);

            // Add to messages if in active conversation (use ref to avoid stale closure)
            if (message.conversationId === activeConversationRef.current) {
                // Ensure messages is an array before spreading
                setMessages(prev => Array.isArray(prev) ? [...prev, message] : [message]);
            }

            // Update conversation list
            refreshConversations();
        });

        newSocket.on("chat:message_edited", ({ messageId, content }: { messageId: number; content: string }) => {
            setMessages(prev => Array.isArray(prev) ? prev.map(msg =>
                msg.id === messageId ? { ...msg, content, isEdited: true } : msg
            ) : []);
        });

        newSocket.on("chat:message_deleted", ({ messageId }: { messageId: number }) => {
            setMessages(prev => Array.isArray(prev) ? prev.map(msg =>
                msg.id === messageId ? { ...msg, content: "Tin nhắn đã bị xóa", isDeleted: true } : msg
            ) : []);
        });

        newSocket.on("chat:reaction", ({ messageId, reaction }: { messageId: number; reaction: any }) => {
            setMessages(prev => Array.isArray(prev) ? prev.map(msg => {
                if (msg.id === messageId) {
                    // Check if there's already a reaction with same emoji from same user (temp optimistic one)
                    const existingIndex = msg.reactions.findIndex(
                        r => r.emoji === reaction.emoji && r.userId === reaction.userId
                    );

                    if (existingIndex !== -1) {
                        // Replace the temporary reaction with the real one from server
                        const updatedReactions = [...msg.reactions];
                        updatedReactions[existingIndex] = reaction;
                        return { ...msg, reactions: updatedReactions };
                    } else {
                        // Add new reaction if it doesn't exist
                        return { ...msg, reactions: [...msg.reactions, reaction] };
                    }
                }
                return msg;
            }) : []);
        });

        newSocket.on("chat:reaction_removed", ({ messageId, reactionId }: { messageId: number; reactionId: number }) => {
            setMessages(prev => Array.isArray(prev) ? prev.map(msg =>
                msg.id === messageId ? { ...msg, reactions: msg.reactions.filter(r => r.id !== reactionId) } : msg
            ) : []);
        });

        newSocket.on("chat:typing_start", ({ userId, username, conversationId }: { userId: number; username: string; conversationId: number }) => {
            if (userId === user?.id) return; // Ignore own typing
            setTypingUsers(prev => {
                const newMap = new Map(prev);
                const current = newMap.get(conversationId) || [];
                if (!current.includes(username)) {
                    newMap.set(conversationId, [...current, username]);
                }
                return newMap;
            });
        });

        newSocket.on("chat:typing_stop", ({ userId, conversationId }: { userId: number; conversationId: number }) => {
            if (userId === user?.id) return;
            setTypingUsers(prev => {
                const newMap = new Map(prev);
                newMap.delete(conversationId);
                return newMap;
            });
        });

        newSocket.on("chat:message_read", ({ conversationId, messageId }: { conversationId: number; messageId: number }) => {
            // Update read status in UI if needed
            console.log(`Message ${messageId} read in conversation ${conversationId}`);
        });

        newSocket.on("chat:conversation_created", () => {
            refreshConversations();
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [token, user]);

    // Load conversations on mount
    useEffect(() => {
        if (token) {
            refreshConversations();
        }
    }, [token]);

    // Join conversation room when active conversation changes
    useEffect(() => {
        if (!socket || !activeConversationId) return;

        socket.emit("chat:join", activeConversationId);
        loadMessages(activeConversationId, 1);

        return () => {
            socket.emit("chat:leave", activeConversationId);
        };
    }, [socket, activeConversationId]);

    const refreshConversations = useCallback(async () => {
        try {
            const data = await chatApi.getConversations();
            if (Array.isArray(data)) {
                setConversations(data);
            } else {
                console.error("Invalid conversations data received:", data);
                setConversations([]);
            }
        } catch (error) {
            console.error("Error loading conversations:", error);
            // Don't set to empty array on error to keep potential stale data or avoiding flash
        }
    }, []);

    const loadMessages = useCallback(async (conversationId: number, page: number) => {
        try {
            setIsLoading(true);
            const data = await chatApi.getMessages(conversationId, page);
            if (page === 1) {
                setMessages(data.messages);
            } else {
                setMessages(prev => [...data.messages, ...prev]);
            }
            setCurrentPage(page);
            setHasMore(data.hasMore);
        } catch (error) {
            console.error("Error loading messages:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadMoreMessages = useCallback(async () => {
        if (!activeConversationId || !hasMore || isLoading) return;
        await loadMessages(activeConversationId, currentPage + 1);
    }, [activeConversationId, currentPage, hasMore, isLoading]);

    const sendMessage = useCallback(async (
        content: string,
        type: "text" | "image" | "file" = "text",
        fileUrl?: string,
        fileName?: string,
        replyToId?: number
    ) => {
        if (!activeConversationId) return;

        try {
            await chatApi.sendMessage({
                conversationId: activeConversationId,
                content,
                type,
                fileUrl,
                fileName,
                replyToId
            });
            // Message will be added via socket event
        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    }, [activeConversationId]);

    const editMessage = useCallback(async (messageId: number, content: string) => {
        try {
            await chatApi.editMessage(messageId, content);
            // Update will come via socket event
        } catch (error) {
            console.error("Error editing message:", error);
            throw error;
        }
    }, []);

    const deleteMessage = useCallback(async (messageId: number) => {
        try {
            await chatApi.deleteMessage(messageId);
            // Update will come via socket event
        } catch (error) {
            console.error("Error deleting message:", error);
            throw error;
        }
    }, []);

    const addReaction = useCallback(async (messageId: number, emoji: string) => {
        if (!user) return;

        // Optimistic update
        const tempReaction = {
            id: Date.now(), // temporary ID
            emoji,
            userId: user.id,
            username: user.username || 'You'
        };

        setMessages(prev => prev.map(msg =>
            msg.id === messageId ? { ...msg, reactions: [...msg.reactions, tempReaction] } : msg
        ));

        try {
            await chatApi.addReaction(messageId, emoji);
            // Real update will come via socket event and replace temp
        } catch (error) {
            console.error("Error adding reaction:", error);
            // Rollback on error
            setMessages(prev => prev.map(msg =>
                msg.id === messageId ? { ...msg, reactions: msg.reactions.filter(r => r.id !== tempReaction.id) } : msg
            ));
            throw error;
        }
    }, [user]);

    const removeReaction = useCallback(async (messageId: number, emoji: string) => {
        if (!user) return;

        // Optimistic update - remove immediately
        setMessages(prev => prev.map(msg =>
            msg.id === messageId
                ? { ...msg, reactions: msg.reactions.filter(r => !(r.emoji === emoji && r.userId === user.id)) }
                : msg
        ));

        try {
            await chatApi.removeReaction(messageId, emoji);
            // Socket event will confirm the removal
        } catch (error) {
            console.error("Error removing reaction:", error);
            // Note: Not rolling back since removal already happened optimistically
            // The socket event (or lack thereof) will be the source of truth
        }
    }, [user]);

    const markAsRead = useCallback(async (conversationId: number, messageId: number) => {
        try {
            await chatApi.markAsRead(conversationId, messageId);
            // Update conversation unread count
            setConversations(prev => prev.map(conv =>
                conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
            ));
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    }, []);

    const startTyping = useCallback((conversationId: number) => {
        if (!socket || !user) return;

        // Clear existing timeout
        const existing = typingTimeoutRef.current.get(conversationId);
        if (existing) clearTimeout(existing);

        socket.emit("chat:typing_start", { conversationId, username: user?.username });

        // Auto stop after 3 seconds
        const timeout = setTimeout(() => {
            stopTyping(conversationId);
        }, 3000);
        typingTimeoutRef.current.set(conversationId, timeout);
    }, [socket, user]);

    const stopTyping = useCallback((conversationId: number) => {
        if (!socket) return;

        const timeout = typingTimeoutRef.current.get(conversationId);
        if (timeout) {
            clearTimeout(timeout);
            typingTimeoutRef.current.delete(conversationId);
        }

        socket.emit("chat:typing_stop", { conversationId });
    }, [socket]);

    const createConversation = useCallback(async (otherUserId: number): Promise<number> => {
        try {
            const { conversationId } = await chatApi.getOrCreateConversation(otherUserId);
            await refreshConversations();
            return conversationId;
        } catch (error) {
            console.error("Error creating conversation:", error);
            throw error;
        }
    }, [refreshConversations]);

    const createGroupConversation = useCallback(async (name: string, participantIds: number[]): Promise<number> => {
        try {
            const { conversationId } = await chatApi.createGroupConversation(name, participantIds);
            await refreshConversations();
            return conversationId;
        } catch (error) {
            console.error("Error creating group:", error);
            throw error;
        }
    }, [refreshConversations]);

    const uploadFile = useCallback(async (file: File) => {
        try {
            const result = await chatApi.uploadFile(file);
            return { fileUrl: result.fileUrl, fileName: result.fileName };
        } catch (error) {
            console.error("Error uploading file:", error);
            throw error;
        }
    }, []);

    // Browser notification helper
    const showNotification = (message: Message) => {
        if (!("Notification" in window)) return;

        if (Notification.permission === "granted") {
            new Notification("Tin nhắn mới", {
                body: `${message.senderName}: ${message.type === "text" ? message.content : "Đã gửi file"}`,
                icon: "/favicon.ico",
                tag: `chat-${message.conversationId}`,
            });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    showNotification(message);
                }
            });
        }
    };

    const value: ChatContextType = {
        socket,
        conversations,
        activeConversationId,
        messages,
        typingUsers,
        unreadTotal,
        isLoading,
        isChatDialogOpen,
        setActiveConversation: setActiveConversationId,
        setChatDialogOpen: setIsChatDialogOpen,
        sendMessage,
        editMessage,
        deleteMessage,
        addReaction,
        removeReaction,
        markAsRead,
        loadMoreMessages,
        startTyping,
        stopTyping,
        refreshConversations,
        createConversation,
        createGroupConversation,
        uploadFile,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
