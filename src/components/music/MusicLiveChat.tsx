import React, { useEffect, useRef, useState, useCallback } from "react";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/hooks/useAuth";
import { chatApi } from "@/services/chatApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarWithFrame } from "@/components/ui/avatar-with-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle, Users, Loader2 } from "lucide-react";
import { getImageUrl, cn } from "@/lib/utils";
import { Message } from "@/services/chatApi";

interface MusicLiveChatProps {
    className?: string;
}

export const MusicLiveChat: React.FC<MusicLiveChatProps> = ({ className }) => {
    const { currentUser } = useAuth();
    const {
        sendMessage,
        messages,
        setActiveConversation,
        markAsRead
    } = useChat();

    const [musicChatId, setMusicChatId] = useState<number | null>(null);
    const [participantCount, setParticipantCount] = useState(0);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize Music Chat
    useEffect(() => {
        const initMusicChat = async () => {
            try {
                setIsLoading(true);
                const data = await chatApi.getMusicChat();
                setMusicChatId(data.conversationId);
                setParticipantCount(data.participantCount);
                setActiveConversation(data.conversationId);
            } catch (error) {
                console.error("Error initializing music chat:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initMusicChat();

        return () => {
            // Don't clear active conversation on unmount as it might affect other components
        };
    }, [setActiveConversation]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Mark as read when messages change
    useEffect(() => {
        if (musicChatId && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.senderId !== currentUser?.id) {
                markAsRead(musicChatId, lastMessage.id);
            }
        }
    }, [musicChatId, messages, currentUser?.id, markAsRead]);

    const handleSend = useCallback(async () => {
        if (!inputValue.trim() || !musicChatId || isSending) return;

        const messageContent = inputValue.trim();
        setInputValue("");
        setIsSending(true);

        try {
            await sendMessage(messageContent);
        } catch (error) {
            console.error("Error sending message:", error);
            setInputValue(messageContent); // Restore on error
        } finally {
            setIsSending(false);
            inputRef.current?.focus();
        }
    }, [inputValue, musicChatId, isSending, sendMessage]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    };

    if (isLoading) {
        return (
            <div className={cn("flex flex-col h-full bg-card border-l border-border", className)}>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col h-full bg-card border-l border-border", className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-sm">Live Chat</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span>{participantCount}</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-2" ref={scrollRef}>
                <div className="space-y-3">
                    {messages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>Chưa có tin nhắn</p>
                            <p className="text-xs mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <MessageItem
                                key={msg.id}
                                message={msg}
                                isOwn={msg.senderId === currentUser?.id}
                                formatTime={formatTime}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-muted/20">
                <div className="flex items-center gap-2">
                    <Input
                        ref={inputRef}
                        placeholder="Nhắn gì đó..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isSending}
                        className="flex-1 h-9 text-sm"
                    />
                    <Button
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isSending}
                    >
                        {isSending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

interface MessageItemProps {
    message: Message;
    isOwn: boolean;
    formatTime: (date: string) => string;
}

// Discord-style flat message layout
const MessageItem: React.FC<MessageItemProps> = ({ message, isOwn, formatTime }) => {
    if (message.isDeleted) {
        return (
            <div className="text-xs text-muted-foreground italic py-1 pl-9">
                Tin nhắn đã bị xóa
            </div>
        );
    }

    return (
        <div className="flex gap-2 py-0.5 hover:bg-muted/30 px-2 -mx-2 rounded group">
            <AvatarWithFrame frameId={(message as any).senderSelectedFrame} size="xs">
                <Avatar className="w-8 h-8 shrink-0 mt-0.5">
                    <AvatarImage src={getImageUrl(message.senderAvatarUrl) || undefined} />
                    <AvatarFallback className="text-xs bg-primary/20 text-primary">
                        {message.senderName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            </AvatarWithFrame>
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                    <span className={cn(
                        "text-sm font-semibold",
                        isOwn ? "text-primary" : "text-foreground"
                    )}>
                        {message.senderName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                        {formatTime(message.createdAt)}
                    </span>
                </div>
                <p className="text-sm text-foreground/90 break-words">
                    {message.content}
                </p>
            </div>
        </div>
    );
};

export default MusicLiveChat;
