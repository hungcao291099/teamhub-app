import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { chatApi } from "@/services/chatApi";
import { Users, UserPlus, Trash2, ArrowRightLeft, MessageCircle, LogOut } from "lucide-react";
import { AddMemberDialog } from "./AddMemberDialog";
import { TransferOwnershipDialog } from "./TransferOwnershipDialog";
import { ChatInfoTabs } from "./ChatInfoTabs/index";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

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
    avatarUrl?: string | null;
}

interface GroupInfoDialogProps {
    conversationId: number | null;
    currentConversation?: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onGroupDeleted?: () => void;
}

export const GroupInfoDialog: React.FC<GroupInfoDialogProps> = ({
    conversationId,
    currentConversation,
    open,
    onOpenChange,
    onGroupDeleted
}) => {
    const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [transferOwnershipOpen, setTransferOwnershipOpen] = useState(false);

    useEffect(() => {
        if (open && conversationId) {
            loadGroupInfo();
        } else {
            setGroupInfo(null);
        }
    }, [open, conversationId]);

    const loadGroupInfo = async () => {
        if (!conversationId) return;

        if (currentConversation && currentConversation.type === "direct") {
            const partner = currentConversation.participants.find((p: any) => p.id !== currentConversation.adminId); // Assuming some logic to find partner, or just take first
            // Or typically in direct, participants has 2 people. 

            setGroupInfo({
                id: currentConversation.id,
                name: currentConversation.name || (currentConversation.participants[0]?.username ?? "Chat"),
                type: "direct",
                createdAt: new Date().toISOString(),
                avatarUrl: currentConversation.avatarUrl || null,
                participants: currentConversation.participants.map((p: any) => ({
                    id: p.id,
                    userId: p.id,
                    username: p.username,
                    name: p.username,
                    avatarUrl: p.avatarUrl,
                    role: "member",
                    joinedAt: new Date().toISOString()
                })),
                currentUserRole: "member"
            });
            return;
        }

        setLoading(true);
        try {
            const info = await chatApi.getGroupInfo(conversationId);
            if (!info || !info.participants) {
                console.error("Invalid group info response:", info);
                setFallbackGroupInfo();
            } else {
                setGroupInfo({
                    ...info,
                    avatarUrl: currentConversation?.avatarUrl // Try to carry over avatar if available
                });
            }
        } catch (error) {
            console.error("Error loading group info:", error);
            setFallbackGroupInfo();
        } finally {
            setLoading(false);
        }
    };

    const setFallbackGroupInfo = () => {
        if (currentConversation) {
            setGroupInfo({
                id: currentConversation.id,
                name: currentConversation.name || "Chat",
                type: currentConversation.type || "direct",
                createdAt: new Date().toISOString(),
                participants: (currentConversation.participants || []).map((p: any) => ({
                    id: p.id,
                    userId: p.id,
                    username: p.username,
                    name: p.username,
                    avatarUrl: p.avatarUrl,
                    role: "member" as const,
                    joinedAt: new Date().toISOString()
                })),
                currentUserRole: "member"
            });
        }
    }

    const isStale = groupInfo && groupInfo.id !== conversationId;
    const showLoading = loading || isStale;

    const handleRemoveMember = async (userId: number) => {
        if (!conversationId || !groupInfo) return;
        if (!confirm("Bạn có chắc chắn muốn xóa thành viên này?")) return;
        try {
            await chatApi.removeGroupMember(conversationId, userId);
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
    const canTransferOwnership = groupInfo && groupInfo.currentUserRole === "owner";
    const canDeleteGroup = groupInfo && groupInfo.currentUserRole === "owner";

    // In direct messages, usually no actions like this
    const isGroup = groupInfo?.type === "group";

    // Determine avatar display
    const displayAvatar = isGroup ? groupInfo?.avatarUrl : groupInfo?.participants.find(p => p.id !== groupInfo.id /* logic check needed */)?.avatarUrl;
    // Simplified logic: stick to group info or first participant
    const avatarSrc = getImageUrl(groupInfo?.avatarUrl);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[400px] p-0 gap-0 overflow-hidden bg-background border-none shadow-2xl">
                    <div className="flex flex-col items-center pt-8 pb-6 px-6 bg-gradient-to-b from-muted/50 to-background border-b rounded-t-lg">
                        <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg mb-4">
                            <AvatarImage src={avatarSrc || undefined} className="object-cover" />
                            <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                                {isGroup ? <Users className="h-10 w-10" /> : groupInfo?.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>

                        <div className="text-center space-y-1 w-full">
                            <h2 className="text-xl font-bold tracking-tight truncate px-4">
                                {showLoading ? "Đang tải..." : groupInfo?.name || "Cuộc trò chuyện"}
                            </h2>
                            {!showLoading && isGroup && (
                                <p className="text-sm text-muted-foreground font-medium">
                                    {groupInfo?.participants.length} thành viên
                                </p>
                            )}
                        </div>

                        {/* Action Buttons Row */}
                        {!showLoading && isGroup && (
                            <div className="flex items-center gap-3 mt-6">
                                {canAddMembers && (
                                    <div className="flex flex-col items-center gap-1">
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="rounded-full h-10 w-10 shadow-sm hover:shadow-md transition-all"
                                            onClick={() => setAddMemberOpen(true)}
                                            title="Thêm thành viên"
                                        >
                                            <UserPlus className="h-5 w-5 text-primary" />
                                        </Button>
                                        <span className="text-[10px] text-muted-foreground font-medium">Thêm</span>
                                    </div>
                                )}

                                {canTransferOwnership && (
                                    <div className="flex flex-col items-center gap-1">
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="rounded-full h-10 w-10 shadow-sm hover:shadow-md transition-all"
                                            onClick={() => setTransferOwnershipOpen(true)}
                                            title="Chuyển quyền"
                                        >
                                            <ArrowRightLeft className="h-5 w-5 text-orange-600" />
                                        </Button>
                                        <span className="text-[10px] text-muted-foreground font-medium">Quyền</span>
                                    </div>
                                )}

                                {canDeleteGroup && (
                                    <div className="flex flex-col items-center gap-1">
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="rounded-full h-10 w-10 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 shadow-sm hover:shadow-md transition-all"
                                            onClick={handleDeleteGroup}
                                            title="Xóa nhóm"
                                        >
                                            <Trash2 className="h-5 w-5 text-red-600" />
                                        </Button>
                                        <span className="text-[10px] text-muted-foreground font-medium">Xóa</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-h-[400px] max-h-[60vh]">
                        {showLoading ? (
                            <div className="flex justify-center items-center h-48">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : groupInfo ? (
                            <ChatInfoTabs
                                key={conversationId}
                                participants={groupInfo.participants}
                                conversationId={conversationId!}
                                type={groupInfo.type}
                                currentUserRole={groupInfo.currentUserRole}
                                onRemoveMember={handleRemoveMember}
                                onPromoteMember={handlePromoteMember}
                            />
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                Không thể tải thông tin
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Sub-Dialogs */}
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
