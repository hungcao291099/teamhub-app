import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { chatApi } from "@/services/chatApi";
import { Users, UserPlus, Crown, Shield, Trash2, ArrowRightLeft, UserMinus } from "lucide-react";
import { AddMemberDialog } from "./AddMemberDialog";
import { TransferOwnershipDialog } from "./TransferOwnershipDialog";

interface GroupMember {
    id: number;
    userId: number;
    username: string;
    name?: string | null;
    avatarUrl?: string | null;
    role: "owner" | "admin" | "member";
    joinedAt: string;
}

interface GroupInfo {
    id: number;
    name: string | null;
    type: "direct" | "group";
    createdAt: string;
    participants: GroupMember[];
    currentUserRole: "owner" | "admin" | "member";
}

interface GroupInfoDialogProps {
    conversationId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGroupDeleted?: () => void;
}

export const GroupInfoDialog: React.FC<GroupInfoDialogProps> = ({
    conversationId,
    open,
    onOpenChange,
    onGroupDeleted
}) => {
    const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [transferOwnershipOpen, setTransferOwnershipOpen] = useState(false);
    const { onlineUsers } = useAuth();

    useEffect(() => {
        if (open && conversationId) {
            loadGroupInfo();
        }
    }, [open, conversationId]);

    const loadGroupInfo = async () => {
        if (!conversationId) return;

        setLoading(true);
        try {
            const info = await chatApi.getGroupInfo(conversationId);
            setGroupInfo(info);
        } catch (error) {
            console.error("Error loading group info:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (userId: number) => {
        if (!conversationId || !groupInfo) return;

        if (!confirm("Bạn có chắc chắn muốn xóa thành viên này?")) return;

        try {
            await chatApi.removeGroupMember(conversationId, userId);
            // Reload group info
            await loadGroupInfo();
        } catch (error: any) {
            console.error("Error removing member:", error);
            alert(error.response?.data?.error || "Không thể xóa thành viên");
        }
    };

    const handlePromoteMember = async (userId: number, currentRole: string) => {
        if (!conversationId || !groupInfo) return;

        const newRole = currentRole === "member" ? "admin" : "member";
        const action = newRole === "admin" ? "thăng" : "hạ";

        if (!confirm(`Bạn có chắc chắn muốn ${action} cấp thành viên này?`)) return;

        try {
            await chatApi.updateMemberRole(conversationId, userId, newRole);
            // Reload group info
            await loadGroupInfo();
        } catch (error: any) {
            console.error("Error updating role:", error);
            alert(error.response?.data?.error || "Không thể cập nhật quyền");
        }
    };

    const handleDeleteGroup = async () => {
        if (!conversationId) return;

        if (!confirm("Bạn có chắc chắn muốn xóa nhóm này? Hành động này không thể hoàn tác.")) return;

        try {
            await chatApi.deleteGroup(conversationId);
            onGroupDeleted?.();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error deleting group:", error);
            alert(error.response?.data?.error || "Không thể xóa nhóm");
        }
    };

    const canAddMembers = groupInfo && (groupInfo.currentUserRole === "owner" || groupInfo.currentUserRole === "admin");
    const canRemoveMembers = groupInfo && (groupInfo.currentUserRole === "owner" || groupInfo.currentUserRole === "admin");
    const canPromoteMembers = groupInfo && groupInfo.currentUserRole === "owner";
    const canTransferOwnership = groupInfo && groupInfo.currentUserRole === "owner";
    const canDeleteGroup = groupInfo && groupInfo.currentUserRole === "owner";

    const getRoleBadge = (role: string) => {
        if (role === "owner") {
            return (
                <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded text-xs font-medium">
                    <Crown className="h-3 w-3" />
                    Trưởng nhóm
                </div>
            );
        }
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
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Thông tin nhóm
                        </DialogTitle>
                    </DialogHeader>

                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
                    ) : groupInfo ? (
                        <div className="space-y-4">
                            {/* Group name */}
                            <div>
                                <h3 className="font-semibold text-lg">{groupInfo.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {groupInfo.participants.length} thành viên
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2">
                                {canAddMembers && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setAddMemberOpen(true)}
                                    >
                                        <UserPlus className="h-4 w-4 mr-1" />
                                        Thêm thành viên
                                    </Button>
                                )}
                                {canTransferOwnership && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setTransferOwnershipOpen(true)}
                                    >
                                        <ArrowRightLeft className="h-4 w-4 mr-1" />
                                        Chuyển quyền trưởng nhóm
                                    </Button>
                                )}
                                {canDeleteGroup && (
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={handleDeleteGroup}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Xóa nhóm
                                    </Button>
                                )}
                            </div>

                            {/* Members list */}
                            <div>
                                <h4 className="font-medium mb-2">Thành viên</h4>
                                <div className="space-y-2">
                                    {groupInfo.participants.map((member) => {
                                        const isOnline = onlineUsers.includes(member.userId);
                                        const canRemove = canRemoveMembers && member.role !== "owner";
                                        const canPromote = canPromoteMembers && member.role !== "owner";

                                        return (
                                            <div
                                                key={member.id}
                                                className="flex items-center gap-3 p-2 rounded hover:bg-accent"
                                            >
                                                <Avatar className="h-8 w-8 relative">
                                                    <AvatarFallback>
                                                        {member.username.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                    {isOnline && (
                                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                                                    )}
                                                </Avatar>

                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">
                                                        {member.username}
                                                    </div>
                                                    {member.name && (
                                                        <div className="text-sm text-muted-foreground truncate">
                                                            {member.name}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {getRoleBadge(member.role)}

                                                    {canPromote && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handlePromoteMember(member.userId, member.role)}
                                                            title={member.role === "admin" ? "Hạ xuống thành viên" : "Thăng lên quản trị viên"}
                                                        >
                                                            <Shield className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    {canRemove && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleRemoveMember(member.userId)}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                                        >
                                                            <UserMinus className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            Không thể tải thông tin nhóm
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Add Member Dialog */}
            {conversationId && groupInfo && (
                <>
                    <AddMemberDialog
                        open={addMemberOpen}
                        onOpenChange={setAddMemberOpen}
                        conversationId={conversationId}
                        existingMemberIds={groupInfo.participants.map(p => p.userId)}
                        onMembersAdded={loadGroupInfo}
                    />

                    <TransferOwnershipDialog
                        open={transferOwnershipOpen}
                        onOpenChange={setTransferOwnershipOpen}
                        conversationId={conversationId}
                        members={groupInfo.participants.filter(p => p.role !== "owner")}
                        onTransferred={() => {
                            loadGroupInfo();
                            setTransferOwnershipOpen(false);
                        }}
                    />
                </>
            )}
        </>
    );
};
