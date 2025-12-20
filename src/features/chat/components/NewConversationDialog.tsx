import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import axios from "@/services/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users as UsersIcon, ImagePlus, X } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

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
    const [groupAvatarFile, setGroupAvatarFile] = useState<File | null>(null);
    const [groupAvatarPreview, setGroupAvatarPreview] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const { createGroupConversation, setActiveConversation } = useChat();
    const { onlineUsers, currentUser } = useAuth();
    const avatarInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            loadUsers();
        } else {
            // Reset state when closed
            setSearch("");
            setSelectedUsers([]);
            setGroupName("");
            setGroupAvatarFile(null);
            setGroupAvatarPreview(null);
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

    // Filter users: exclude current user and apply search
    const filteredUsers = users.filter(u => {
        // Exclude current user
        if (currentUser && u.id === currentUser.id) return false;
        // Apply search filter
        return u.username.toLowerCase().includes(search.toLowerCase()) ||
            u.name?.toLowerCase().includes(search.toLowerCase());
    });

    const handleUserToggle = (userId: number) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setGroupAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setGroupAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearAvatar = () => {
        setGroupAvatarFile(null);
        setGroupAvatarPreview(null);
        if (avatarInputRef.current) {
            avatarInputRef.current.value = "";
        }
    };

    const handleCreate = async () => {
        // Group name is required
        if (!groupName.trim()) {
            alert("Vui lòng nhập tên nhóm");
            return;
        }

        setIsCreating(true);
        try {
            // Create group conversation (members are optional)
            const conversationId = await createGroupConversation(groupName.trim(), selectedUsers);
            setActiveConversation(conversationId);
            onOpenChange(false);
        } catch (error) {
            console.error("Error creating group:", error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Tạo nhóm mới</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Group Avatar */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                                id="group-avatar-input"
                            />
                            <label
                                htmlFor="group-avatar-input"
                                className="cursor-pointer block"
                            >
                                <div className="w-16 h-16 rounded-full bg-accent/50 border-2 border-dashed border-border hover:border-primary/50 transition-colors flex items-center justify-center overflow-hidden">
                                    {groupAvatarPreview ? (
                                        <img src={groupAvatarPreview} alt="Group avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImagePlus className="w-6 h-6 text-muted-foreground" />
                                    )}
                                </div>
                            </label>
                            {groupAvatarPreview && (
                                <button
                                    onClick={clearAvatar}
                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <div className="flex-1">
                            <Input
                                placeholder="Tên nhóm *"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="font-medium"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Bắt buộc nhập tên nhóm</p>
                        </div>
                    </div>

                    {/* Member section header */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">
                            <UsersIcon className="inline h-4 w-4 mr-1" />
                            Thêm thành viên (tùy chọn)
                        </p>
                        {selectedUsers.length > 0 && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {selectedUsers.length} đã chọn
                            </span>
                        )}
                    </div>

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
                    <div className="max-h-48 overflow-y-auto pr-1">
                        {filteredUsers.length === 0 ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                                Không tìm thấy người dùng
                            </div>
                        ) : (
                            filteredUsers.map(user => {
                                const isSelected = selectedUsers.includes(user.id);
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
                            disabled={!groupName.trim() || isCreating}
                            className="flex-1"
                        >
                            {isCreating ? "Đang tạo..." : "Tạo nhóm"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
