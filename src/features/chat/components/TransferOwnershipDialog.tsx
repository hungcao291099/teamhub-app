import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { chatApi } from "@/services/chatApi";
import { ArrowRightLeft, Crown, Shield, AlertTriangle } from "lucide-react";

interface GroupMember {
    id: number;
    userId: number;
    username: string;
    name?: string | null;
    avatarUrl?: string | null;
    role: "owner" | "admin" | "member";
}

interface TransferOwnershipDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    conversationId: number;
    members: GroupMember[];
    onTransferred: () => void;
}

export const TransferOwnershipDialog: React.FC<TransferOwnershipDialogProps> = ({
    open,
    onOpenChange,
    conversationId,
    members,
    onTransferred
}) => {
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [isTransferring, setIsTransferring] = useState(false);
    const { onlineUsers } = useAuth();

    const handleTransfer = async () => {
        if (!selectedUserId) return;

        if (!confirm("Bạn có chắc chắn muốn chuyển quyền trưởng nhóm? Bạn sẽ trở thành quản trị viên.")) {
            return;
        }

        setIsTransferring(true);
        try {
            await chatApi.transferOwnership(conversationId, selectedUserId);
            onTransferred();
        } catch (error: any) {
            console.error("Error transferring ownership:", error);
            alert(error.response?.data?.error || "Không thể chuyển quyền trưởng nhóm");
        } finally {
            setIsTransferring(false);
        }
    };

    const getRoleBadge = (role: string) => {
        if (role === "admin") {
            return (
                <div className="flex items-center gap-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-medium">
                    <Shield className="h-3 w-3" />
                    Quản trị viên
                </div>
            );
        }
        return null;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowRightLeft className="h-5 w-5" />
                        Chuyển quyền trưởng nhóm
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Warning */}
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 flex gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800 dark:text-yellow-200">
                            Sau khi chuyển quyền, bạn sẽ trở thành quản trị viên. Chỉ trưởng nhóm mới có thể xóa nhóm hoặc chuyển quyền lại.
                        </div>
                    </div>

                    {/* Member selection */}
                    <div>
                        <h4 className="font-medium mb-2">Chọn thành viên làm trưởng nhóm mới</h4>
                        <div className="border rounded-md max-h-60 overflow-y-auto">
                            {members.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground text-sm">
                                    Không có thành viên nào để chuyển quyền
                                </div>
                            ) : (
                                members.map(member => (
                                    <button
                                        key={member.id}
                                        onClick={() => setSelectedUserId(member.userId)}
                                        className={`w-full p-3 flex items-center gap-3 hover:bg-accent transition-colors ${selectedUserId === member.userId ? "bg-accent" : ""
                                            }`}
                                    >
                                        <Avatar className="h-8 w-8 relative">
                                            <AvatarFallback>
                                                {member.username.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                            {onlineUsers.includes(member.userId) && (
                                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                                            )}
                                        </Avatar>

                                        <div className="text-left flex-1 min-w-0">
                                            <div className="font-medium truncate">{member.username}</div>
                                            {member.name && (
                                                <div className="text-sm text-muted-foreground truncate">
                                                    {member.name}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {getRoleBadge(member.role)}
                                            {selectedUserId === member.userId && (
                                                <Crown className="h-5 w-5 text-yellow-600" />
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleTransfer}
                            disabled={!selectedUserId || isTransferring}
                            className="flex-1"
                        >
                            {isTransferring ? "Đang chuyển..." : "Chuyển quyền"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
