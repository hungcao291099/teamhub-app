import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import axios from "@/services/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Users as UsersIcon } from "lucide-react";

interface User {
    id: number;
    username: string;
    name: string;
    avatarUrl: string | null;
}

interface NewConversationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const NewConversationDialog: React.FC<NewConversationDialogProps> = ({ open, onOpenChange }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [groupName, setGroupName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const { createConversation, createGroupConversation, setActiveConversation } = useChat();
    const { onlineUsers } = useAuth();

    useEffect(() => {
        if (open) {
            loadUsers();
        } else {
            // Reset state when closed
            setSearch("");
            setSelectedUsers([]);
            setGroupName("");
        }
    }, [open]);

    const loadUsers = async () => {
        try {
            const response = await axios.get("/users");
            // Handle both response structures: { users: [...] } or [...]
            const usersData = response.data.users || response.data;
            setUsers(Array.isArray(usersData) ? usersData : []);
        } catch (error) {
            console.error("Error loading users:", error);
            setUsers([]); // Set to empty array on error
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.name?.toLowerCase().includes(search.toLowerCase())
    );

    const handleUserToggle = (userId: number) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleCreate = async () => {
        if (selectedUsers.length === 0) return;

        setIsCreating(true);
        try {
            let conversationId: number;

            if (selectedUsers.length === 1) {
                // Create 1-1 conversation
                conversationId = await createConversation(selectedUsers[0]);
            } else {
                // Create group conversation
                if (!groupName.trim()) {
                    alert("Vui lòng nhập tên nhóm");
                    return;
                }
                conversationId = await createGroupConversation(groupName.trim(), selectedUsers);
            }

            setActiveConversation(conversationId);
            onOpenChange(false);
        } catch (error) {
            console.error("Error creating conversation:", error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Tạo cuộc trò chuyện mới</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm người dùng..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Group name (if multiple selected) */}
                    {selectedUsers.length > 1 && (
                        <Input
                            placeholder="Tên nhóm..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                    )}

                    {/* User list */}
                    <div className="max-h-60 overflow-y-auto border rounded-md">
                        {filteredUsers.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                                Không tìm thấy người dùng
                            </div>
                        ) : (
                            filteredUsers.map(user => (
                                <Button
                                    key={user.id}
                                    variant="ghost"
                                    onClick={() => handleUserToggle(user.id)}
                                    className={`w-full p-3 h-auto justify-start flex items-center gap-3 hover:bg-accent transition-colors ${selectedUsers.includes(user.id) ? "bg-accent" : ""
                                        }`}
                                >
                                    <Avatar className="h-8 w-8 relative">
                                        <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                                        {onlineUsers.includes(user.id) && (
                                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                                        )}
                                    </Avatar>
                                    <div className="text-left">
                                        <div className="font-medium">{user.username}</div>
                                        {user.name && (
                                            <div className="text-sm text-muted-foreground">{user.name}</div>
                                        )}
                                    </div>
                                    {selectedUsers.includes(user.id) && (
                                        <div className="ml-auto text-blue-600">✓</div>
                                    )}
                                </Button>
                            ))
                        )}
                    </div>

                    {/* Summary */}
                    {selectedUsers.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                            {selectedUsers.length === 1 ? (
                                "Tạo cuộc trò chuyện cá nhân"
                            ) : (
                                <>
                                    <UsersIcon className="inline h-4 w-4 mr-1" />
                                    Tạo nhóm với {selectedUsers.length} thành viên
                                </>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={selectedUsers.length === 0 || isCreating || (selectedUsers.length > 1 && !groupName.trim())}
                            className="flex-1"
                        >
                            {isCreating ? "Đang tạo..." : "Tạo"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
