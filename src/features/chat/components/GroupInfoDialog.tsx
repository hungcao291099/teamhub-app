import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { chatApi } from "@/services/chatApi";
import { Users, UserPlus, Trash2, ArrowRightLeft } from "lucide-react";
import { AddMemberDialog } from "./AddMemberDialog";
import { TransferOwnershipDialog } from "./TransferOwnershipDialog";
import { ChatInfoTabs } from "./ChatInfoTabs/index";

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
    currentConversation?: any; // Will fix type
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
            // Reset info when dialog closes or conversationId clears
            setGroupInfo(null);
        }
    }, [open, conversationId]);

    const loadGroupInfo = async () => {
        if (!conversationId) return;

        // If it's a direct conversation, we can construct info from currentConversation
        // bypassing the API which might fail for non-groups
        if (currentConversation && currentConversation.type === "direct") {
            setGroupInfo({
                id: currentConversation.id,
                name: currentConversation.name || (currentConversation.participants[0]?.username ?? "Chat"),
                type: "direct",
                createdAt: new Date().toISOString(), // Mock or get from conversation
                participants: currentConversation.participants.map((p: any) => ({
                    id: p.id, // Participant ID might differ from User ID ideally, but here we assume... wait. 
                    // In chatApi.ts, participants have { id, username, avatarUrl }.
                    // In GroupInfo, participants have { id, userId, username, role... }
                    // We need to map standard participants to GroupMember structure.
                    // For direct chat, roles don't matter much.
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
            // Ensure participants is always an array
            if (!info || !info.participants) {
                console.error("Invalid group info response:", info);
                setGroupInfo({
                    id: conversationId,
                    name: null,
                    type: currentConversation?.type || "direct",
                    createdAt: new Date().toISOString(),
                    participants: [],
                    currentUserRole: "member"
                });
            } else {
                setGroupInfo(info);
            }
        } catch (error) {
            console.error("Error loading group info:", error);
            // Fallback for direct chat if API fails but we have basic info
            if (currentConversation && currentConversation.type === "direct") {
                setGroupInfo({
                    id: conversationId,
                    name: currentConversation.name || (currentConversation.participants?.[0]?.username ?? "Chat"),
                    type: "direct",
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
            } else {
                // Set safe empty defaults to prevent undefined errors
                setGroupInfo({
                    id: conversationId,
                    name: null,
                    type: "direct",
                    createdAt: new Date().toISOString(),
                    participants: [],
                    currentUserRole: "member"
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // Check if displayed info matches current conversation
    const isStale = groupInfo && groupInfo.id !== conversationId;
    const showLoading = loading || isStale;

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
    const canTransferOwnership = groupInfo && groupInfo.currentUserRole === "owner";
    const canDeleteGroup = groupInfo && groupInfo.currentUserRole === "owner";

    const isGroup = groupInfo?.type === "group";

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            {isGroup ? "Thông tin nhóm" : "Thông tin cuộc trò chuyện"}
                        </DialogTitle>
                    </DialogHeader>

                    {showLoading ? (
                        <div className="text-center py-8 text-muted-foreground">Đang tải...</div>
                    ) : groupInfo ? (
                        <div className="space-y-4">
                            {/* Group name - Only for groups */}
                            {isGroup && (
                                <div>
                                    <h3 className="font-semibold text-lg">{groupInfo.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {groupInfo.participants.length} thành viên
                                    </p>
                                </div>
                            )}

                            {/* Actions - Only for groups */}
                            {isGroup && (
                                <div className="flex flex-wrap gap-2">
                                    {canAddMembers && (
                                        <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => setAddMemberOpen(true)}
                                        >
                                            <UserPlus className="h-4 w-4 mr-1" />
                                            Thêm
                                        </Button>
                                    )}
                                    {canTransferOwnership && (
                                        <Button
                                            size="sm"
                                            variant="warning"
                                            onClick={() => setTransferOwnershipOpen(true)}
                                        >
                                            <ArrowRightLeft className="h-4 w-4 mr-1" />
                                            Chuyển quyền
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
                            )}

                            {/* Tabs: Members, Media, Links */}
                            <ChatInfoTabs
                                key={conversationId} // Force remount when conversation changes
                                participants={groupInfo.participants}
                                conversationId={conversationId!}
                                type={groupInfo.type}
                                currentUserRole={groupInfo.currentUserRole}
                                onRemoveMember={handleRemoveMember}
                                onPromoteMember={handlePromoteMember}
                            />
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
