import React from "react";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/utils";

export const ConversationList: React.FC = () => {
    const { conversations, activeConversationId, setActiveConversation } = useChat();
    const { onlineUsers } = useAuth();

    if (conversations.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
                <p className="text-sm text-center">Chưa có cuộc trò chuyện nào</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => {
                const isActive = conv.id === activeConversationId;
                const displayName = conv.type === "group"
                    ? (conv.name || "Group Chat")
                    : (conv.participants[0]?.name || conv.participants[0]?.username || "Unknown");
                const avatarText = displayName.charAt(0).toUpperCase();

                const otherUser = conv.type === "direct" ? conv.participants[0] : null;
                const isOnline = otherUser ? onlineUsers.includes(otherUser.id) : false;

                const avatarUrl = conv.type === "direct" && otherUser?.avatarUrl
                    ? getImageUrl(otherUser.avatarUrl)
                    : undefined;

                return (
                    <Button
                        key={conv.id}
                        variant="ghost"
                        onClick={() => setActiveConversation(conv.id)}
                        className={`w-full p-3 h-auto justify-start flex items-start gap-3 hover:bg-accent transition-colors ${isActive ? "bg-accent" : ""
                            }`}
                    >
                        {/* Wrapper with fixed size to ensure absolute positioning works relative to avatar */}
                        <div className="relative w-10 h-10 shrink-0">
                            <Avatar className="h-full w-full">
                                <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                                <AvatarFallback>
                                    {conv.type === "group" ? <Users className="h-4 w-4" /> : avatarText}
                                </AvatarFallback>
                            </Avatar>
                            {isOnline && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full z-50 ring-2 ring-background" />
                            )}
                        </div>

                        <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center justify-between">
                                <span className={`truncate ${conv.unreadCount > 0 ? "font-bold" : "font-medium"
                                    }`}>{displayName}</span>
                                {conv.lastMessage && (
                                    <span className="text-xs text-muted-foreground font-normal">
                                        {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true, locale: vi })}
                                    </span>
                                )}
                            </div>
                            {conv.lastMessage && (
                                <p className={`text-sm truncate ${conv.unreadCount > 0
                                    ? "font-semibold text-foreground"
                                    : "text-muted-foreground font-normal"
                                    }`}>
                                    {conv.lastMessage.type === "image"
                                        ? "Đã gửi hình ảnh"
                                        : (conv.lastMessage.content || "Tin nhắn đã bị xóa")}
                                </p>
                            )}
                        </div>

                        {conv.unreadCount > 0 && (
                            <div className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                            </div>
                        )}
                    </Button>
                );
            })}
        </div>
    );
};
