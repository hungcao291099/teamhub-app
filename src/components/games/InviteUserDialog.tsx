import { useState, useEffect } from "react";
import { inviteToTable } from "@/services/gamesService";
import { getUsers } from "@/services/userService";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Loader2, Send, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface User {
    id: number;
    username: string;
    name?: string;
    avatarUrl?: string;
}

interface InviteUserDialogProps {
    tableId: number | null;
    onOpenChange: (open: boolean) => void;
}

export function InviteUserDialog({ tableId, onOpenChange }: InviteUserDialogProps) {
    const { currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [inviting, setInviting] = useState<number | null>(null);

    useEffect(() => {
        if (tableId) {
            loadUsers();
        }
    }, [tableId]);

    const loadUsers = async () => {
        try {
            const data = await getUsers();
            setUsers(data.filter((u: User) => u.id !== currentUser?.id));
        } catch (error) {
            console.error("Failed to load users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (userId: number) => {
        if (!tableId) return;

        setInviting(userId);
        try {
            await inviteToTable(tableId, userId);
            toast.success("Đã gửi lời mời!");
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Không thể mời");
        } finally {
            setInviting(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <Dialog open={tableId !== null} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Mời người chơi</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    {/* User List */}
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="max-h-[300px] overflow-y-auto space-y-2">
                            {filteredUsers.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-4">
                                    Không tìm thấy người dùng
                                </p>
                            ) : (
                                filteredUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatarUrl} />
                                                <AvatarFallback>
                                                    {(user.name || user.username)[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">{user.name || user.username}</p>
                                                <p className="text-xs text-muted-foreground">@{user.username}</p>
                                            </div>
                                        </div>

                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleInvite(user.id)}
                                            disabled={inviting === user.id}
                                        >
                                            {inviting === user.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
