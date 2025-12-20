import React, { useState, useEffect, useMemo } from "react";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import axios from "@/services/api";

interface User {
    id: number;
    username: string;
    name: string;
    avatarUrl: string | null;
    lastLogin?: string;
}

export const DMSidebar: React.FC = () => {
    const { createConversation, setActiveConversation, conversations, activeConversationId } = useChat();
    const { onlineUsers, currentUser } = useAuth();
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState<User[]>([]);

    // Load all users on mount
    useEffect(() => {
        const loadUsers = async () => {
            try {
                const response = await axios.get("/users");
                const usersData = response.data.users || response.data;
                setUsers(Array.isArray(usersData) ? usersData : []);
            } catch (error) {
                console.error("Error loading users:", error);
                setUsers([]);
            }
        };
        loadUsers();
    }, []);

    // Filter and sort users: exclude current user, filter by search, sort by online status
    const filteredUsers = useMemo(() => {
        return users
            .filter(u => {
                // Exclude current user
                if (currentUser && u.id === currentUser.id) return false;
                // Apply search filter
                const name = u.name || u.username || "";
                return name.toLowerCase().includes(search.toLowerCase()) ||
                    u.username.toLowerCase().includes(search.toLowerCase());
            })
            .sort((a, b) => {
                // Online users first
                const aOnline = onlineUsers.includes(a.id);
                const bOnline = onlineUsers.includes(b.id);
                if (aOnline && !bOnline) return -1;
                if (!aOnline && bOnline) return 1;
                // Then sort by name
                return (a.name || a.username).localeCompare(b.name || b.username);
            });
    }, [users, search, onlineUsers, currentUser]);

    const handleUserClick = async (userId: number) => {
        try {
            // Check if conversation already exists
            const existingConv = conversations.find(
                c => c.type === "direct" && c.participants.some(p => p.id === userId)
            );

            if (existingConv) {
                setActiveConversation(existingConv.id);
            } else {
                // Create new 1-1 conversation
                const conversationId = await createConversation(userId);
                setActiveConversation(conversationId);
            }
        } catch (error) {
            console.error("Error opening conversation:", error);
        }
    };

    return (
        <div className="w-64 flex flex-col bg-secondary/10 border-l h-full shrink-0">
            <div className="p-3 shadow-sm border-b bg-background/50">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm người dùng"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 h-9 bg-background/50 border-none shadow-none focus-visible:ring-1"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Người dùng — {filteredUsers.length}
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground p-4">
                        Không tìm thấy
                    </div>
                )}

                {filteredUsers.map((user) => {
                    const isOnline = onlineUsers.includes(user.id);
                    const name = user.name || user.username || "Unknown";

                    // Check if this user has an active conversation selected
                    const userConv = conversations.find(
                        c => c.type === "direct" && c.participants.some(p => p.id === user.id)
                    );
                    const isActive = userConv?.id === activeConversationId;
                    const unreadCount = userConv?.unreadCount || 0;

                    return (
                        <div
                            key={user.id}
                            onClick={() => handleUserClick(user.id)}
                            className={cn(
                                "group flex items-center gap-3 w-full p-3 mb-2 rounded-xl transition-all cursor-pointer border shadow-sm",
                                isActive
                                    ? "bg-primary/10 border-primary/20"
                                    : "bg-card hover:bg-accent/50 hover:border-primary/20 border-transparent"
                            )}
                        >
                            <div className="relative shrink-0">
                                <Avatar className="h-10 w-10 border border-background shadow-sm">
                                    <AvatarImage src={getImageUrl(user.avatarUrl)} className="object-cover" />
                                    <AvatarFallback className="text-sm font-semibold">{name.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                {isOnline && (
                                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full ring-1 ring-background" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <span className={cn(
                                        "truncate text-sm font-semibold",
                                        isActive ? "text-primary" : "text-foreground",
                                        unreadCount > 0 && "font-bold"
                                    )}>
                                        {name}
                                    </span>
                                    {unreadCount > 0 && (
                                        <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs truncate opacity-70 flex items-center gap-1.5 h-4">
                                    {isOnline ? (
                                        <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                            Trực tuyến
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">Ngoại tuyến</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
