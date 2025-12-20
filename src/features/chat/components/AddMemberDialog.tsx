import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { chatApi } from "@/services/chatApi";
import axios from "@/services/api";
import { Search, UserPlus } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

interface User {
    id: number;
    username: string;
    name?: string | null;
    avatarUrl?: string | null;
}

interface AddMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    conversationId: number;
    existingMemberIds: number[];
    onMembersAdded: () => void;
}

export const AddMemberDialog: React.FC<AddMemberDialogProps> = ({
    open,
    onOpenChange,
    conversationId,
    existingMemberIds,
    onMembersAdded
}) => {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const { onlineUsers } = useAuth();

    useEffect(() => {
        if (open) {
            loadUsers();
        } else {
            // Reset state when closed
            setSearch("");
            setSelectedUserIds([]);
        }
    }, [open]);

    const loadUsers = async () => {
        try {
            const response = await axios.get("/users");
            const usersData = response.data.users || response.data;
            // Filter out existing members
            const nonMembers = usersData.filter(
                (user: User) => !existingMemberIds.includes(user.id)
            );
            setUsers(Array.isArray(nonMembers) ? nonMembers : []);
        } catch (error) {
            console.error("Error loading users:", error);
            setUsers([]);
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.name?.toLowerCase().includes(search.toLowerCase())
    );

    const handleUserToggle = (userId: number) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleAddMembers = async () => {
        if (selectedUserIds.length === 0) return;

        setIsAdding(true);
        try {
            await chatApi.addGroupMember(conversationId, selectedUserIds);
            onMembersAdded();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error adding members:", error);
            alert(error.response?.data?.error || "Không thể thêm thành viên");
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Thêm thành viên
                    </DialogTitle>
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

                    {/* User list */}
                    <div className="max-h-60 overflow-y-auto pr-1">
                        {filteredUsers.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                                {users.length === 0
                                    ? "Không có người dùng nào để thêm"
                                    : "Không tìm thấy người dùng"}
                            </div>
                        ) : (
                            filteredUsers.map(user => {
                                const isSelected = selectedUserIds.includes(user.id);
                                const isOnline = onlineUsers.includes(user.id);
                                return (
                                    <div
                                        key={user.id}
                                        onClick={() => handleUserToggle(user.id)}
                                        className={`group flex items-center gap-3 w-full p-3 mb-2 rounded-xl border bg-card hover:bg-accent/50 hover:border-primary/20 hover:shadow-sm transition-all shadow-sm cursor-pointer ${isSelected ? "ring-2 ring-primary bg-primary/5 border-primary" : "border-border/50"
                                            }`}
                                    >
                                        <div className="relative shrink-0">
                                            <Avatar className="h-10 w-10 border border-background shadow-sm">
                                                <AvatarImage src={getImageUrl(user.avatarUrl) || undefined} className="object-cover" />
                                                <AvatarFallback className="text-sm font-semibold">{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            {isOnline && (
                                                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full ring-1 ring-background" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm truncate">{user.username}</div>
                                            {user.name && (
                                                <div className="text-xs text-muted-foreground truncate">{user.name}</div>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <div className="shrink-0 text-primary">
                                                <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">✓</div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Summary */}
                    {selectedUserIds.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                            Đã chọn {selectedUserIds.length} người dùng
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
                            onClick={handleAddMembers}
                            disabled={selectedUserIds.length === 0 || isAdding}
                            className="flex-1"
                        >
                            {isAdding ? "Đang thêm..." : `Thêm (${selectedUserIds.length})`}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
