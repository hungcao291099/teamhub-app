import React, { useState, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl } from "@/lib/utils";
import { X, UserPlus, ArrowRightLeft, Trash2, Pencil, Loader2, Camera, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chatApi } from "@/services/chatApi";
import { ChatInfoTabs } from "../ChatInfoTabs/index";
import { AddMemberDialog } from "../AddMemberDialog";
import { TransferOwnershipDialog } from "../TransferOwnershipDialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    avatarUrl?: string | null;
    type: "direct" | "group";
    createdAt: string;
    participants: GroupMember[];
    currentUserRole: "owner" | "admin" | "member";
}

interface InfoSidebarProps {
    onClose: () => void;
}

// Type for confirmation dialog state
interface ConfirmDialogState {
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: "default" | "destructive";
}

// Type for alert dialog state
interface AlertDialogState {
    open: boolean;
    title: string;
    message: string;
}

export const InfoSidebar: React.FC<InfoSidebarProps> = ({ onClose }) => {
    const { conversations, activeConversationId, setActiveConversation } = useChat();
    const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [transferOwnershipOpen, setTransferOwnershipOpen] = useState(false);
    const [editGroupOpen, setEditGroupOpen] = useState(false);
    const [editName, setEditName] = useState("");
    const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
    const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const avatarInputRef = React.useRef<HTMLInputElement>(null);

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
        open: false,
        title: "",
        description: "",
        onConfirm: () => { },
        variant: "default"
    });

    // Alert dialog state
    const [alertDialog, setAlertDialog] = useState<AlertDialogState>({
        open: false,
        title: "Thông báo",
        message: ""
    });

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    useEffect(() => {
        if (activeConversationId) {
            loadGroupInfo();
        } else {
            setGroupInfo(null);
        }
    }, [activeConversationId]);

    const showAlert = (message: string, title: string = "Thông báo") => {
        setAlertDialog({ open: true, title, message });
    };

    const showConfirm = (
        title: string,
        description: string,
        onConfirm: () => void,
        variant: "default" | "destructive" = "default"
    ) => {
        setConfirmDialog({ open: true, title, description, onConfirm, variant });
    };

    const loadGroupInfo = async () => {
        if (!activeConversationId) return;

        // If it's a direct conversation, construct info from activeConversation
        if (activeConversation && activeConversation.type === "direct") {
            const participants = activeConversation.participants || [];
            setGroupInfo({
                id: activeConversation.id,
                name: activeConversation.name || (participants[0]?.username ?? "Chat"),
                type: "direct",
                createdAt: new Date().toISOString(),
                participants: participants.map((p: any) => ({
                    id: p.id,
                    userId: p.id,
                    username: p.username,
                    name: p.name || p.username,
                    avatarUrl: p.avatarUrl,
                    role: "member" as const,
                    joinedAt: new Date().toISOString()
                })),
                currentUserRole: "member"
            });
            return;
        }

        setLoading(true);
        try {
            const info = await chatApi.getGroupInfo(activeConversationId);
            if (!info || !info.participants) {
                console.error("Invalid group info response:", info);
                setFallbackGroupInfo();
            } else {
                setGroupInfo(info);
            }
        } catch (error) {
            console.error("Error loading group info:", error);
            setFallbackGroupInfo();
        } finally {
            setLoading(false);
        }
    };

    const setFallbackGroupInfo = () => {
        if (activeConversation) {
            const participants = activeConversation.participants || [];
            setGroupInfo({
                id: activeConversationId!,
                name: activeConversation.name || (participants[0]?.username ?? "Chat"),
                type: activeConversation.type || "direct",
                createdAt: new Date().toISOString(),
                participants: participants.map((p: any) => ({
                    id: p.id,
                    userId: p.id,
                    username: p.username,
                    name: p.name || p.username,
                    avatarUrl: p.avatarUrl,
                    role: "member" as const,
                    joinedAt: new Date().toISOString()
                })),
                currentUserRole: "member"
            });
        }
    }

    const handleRemoveMember = (userId: number) => {
        if (!activeConversationId || !groupInfo) return;

        showConfirm(
            "Xóa thành viên",
            "Bạn có chắc chắn muốn xóa thành viên này?",
            async () => {
                try {
                    await chatApi.removeGroupMember(activeConversationId, userId);
                    await loadGroupInfo();
                } catch (error: any) {
                    console.error("Error removing member:", error);
                    showAlert(error.response?.data?.error || "Không thể xóa thành viên", "Lỗi");
                }
            },
            "destructive"
        );
    };

    const handlePromoteMember = (userId: number, currentRole: string) => {
        if (!activeConversationId || !groupInfo) return;

        const newRole = currentRole === "member" ? "admin" : "member";
        const action = newRole === "admin" ? "thăng" : "hạ";

        showConfirm(
            "Thay đổi quyền",
            `Bạn có chắc chắn muốn ${action} cấp thành viên này?`,
            async () => {
                try {
                    await chatApi.updateMemberRole(activeConversationId, userId, newRole);
                    await loadGroupInfo();
                } catch (error: any) {
                    console.error("Error updating role:", error);
                    showAlert(error.response?.data?.error || "Không thể cập nhật quyền", "Lỗi");
                }
            }
        );
    };

    const handleDeleteGroup = () => {
        if (!activeConversationId) return;

        showConfirm(
            "Xóa nhóm",
            "Bạn có chắc chắn muốn xóa nhóm này? Hành động này không thể hoàn tác.",
            async () => {
                try {
                    await chatApi.deleteGroup(activeConversationId);
                    setActiveConversation(null);
                    onClose();
                } catch (error: any) {
                    console.error("Error deleting group:", error);
                    showAlert(error.response?.data?.error || "Không thể xóa nhóm", "Lỗi");
                }
            },
            "destructive"
        );
    };

    const handleEditGroup = () => {
        if (!groupInfo) return;
        setEditName(groupInfo.name || "");
        setEditAvatarPreview(groupInfo.avatarUrl ? getImageUrl(groupInfo.avatarUrl) : null);
        setEditAvatarFile(null);
        setEditGroupOpen(true);
    };

    const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setEditAvatarFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveGroupEdit = async () => {
        if (!activeConversationId || !editName.trim()) return;

        setIsUpdating(true);
        try {
            let avatarUrl: string | undefined = undefined;

            // Upload avatar if selected
            if (editAvatarFile) {
                const uploadResult = await chatApi.uploadFile(editAvatarFile);
                avatarUrl = uploadResult.fileUrl;
            }

            await chatApi.updateGroup(activeConversationId, {
                name: editName.trim(),
                ...(avatarUrl && { avatarUrl })
            });
            await loadGroupInfo();
            setEditGroupOpen(false);
            setEditAvatarFile(null);
            setEditAvatarPreview(null);
        } catch (error: any) {
            console.error("Error updating group:", error);
            showAlert(error.response?.data?.error || "Không thể cập nhật nhóm", "Lỗi");
        } finally {
            setIsUpdating(false);
        }
    };

    if (!activeConversation) return null;

    const isGroup = activeConversation.type === "group";
    const displayName = isGroup
        ? activeConversation.name || "Group Chat"
        : (activeConversation.participants[0]?.name || activeConversation.participants[0]?.username || "Unknown");

    const canAddMembers = groupInfo && (groupInfo.currentUserRole === "owner" || groupInfo.currentUserRole === "admin");
    const canEditGroup = groupInfo && (groupInfo.currentUserRole === "owner" || groupInfo.currentUserRole === "admin");
    const canTransferOwnership = groupInfo && groupInfo.currentUserRole === "owner";
    const canDeleteGroup = groupInfo && groupInfo.currentUserRole === "owner";

    // Avatar source
    const avatarSrc = getImageUrl(
        isGroup
            ? groupInfo?.avatarUrl
            : activeConversation.participants[0]?.avatarUrl
    );

    return (
        <>
            <div className="w-80 border-l bg-background flex flex-col h-full shadow-xl">
                <div className="flex flex-col items-center pt-8 pb-6 px-6 bg-gradient-to-b from-muted/50 to-background border-b">
                    <div className="absolute top-4 right-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg mb-4">
                        <AvatarImage src={avatarSrc || undefined} className="object-cover" />
                        <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                            {isGroup ? <Users className="h-10 w-10" /> : displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="text-center space-y-1 w-full">
                        <h2 className="text-xl font-bold tracking-tight truncate px-4">
                            {loading ? "Đang tải..." : displayName}
                        </h2>
                        {!loading && isGroup && groupInfo && (
                            <p className="text-sm text-muted-foreground font-medium">
                                {groupInfo.participants.length} thành viên
                            </p>
                        )}
                    </div>

                    {/* Action Buttons Row */}
                    {!loading && isGroup && groupInfo && (
                        <div className="flex items-center gap-3 mt-6">
                            {canEditGroup && (
                                <div className="flex flex-col items-center gap-1">
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="rounded-full h-10 w-10 shadow-sm hover:shadow-md transition-all"
                                        onClick={handleEditGroup}
                                        title="Sửa nhóm"
                                    >
                                        <Pencil className="h-4 w-4 text-primary" />
                                    </Button>
                                    <span className="text-[10px] text-muted-foreground font-medium">Sửa</span>
                                </div>
                            )}

                            {canAddMembers && (
                                <div className="flex flex-col items-center gap-1">
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="rounded-full h-10 w-10 shadow-sm hover:shadow-md transition-all"
                                        onClick={() => setAddMemberOpen(true)}
                                        title="Thêm thành viên"
                                    >
                                        <UserPlus className="h-4 w-4 text-primary" />
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
                                        <ArrowRightLeft className="h-4 w-4 text-orange-600" />
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
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                    <span className="text-[10px] text-muted-foreground font-medium">Xóa</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {/* Tabs: Members, Media, Links */}
                    {loading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : groupInfo ? (
                        <div className="px-0 py-0 h-full">
                            <ChatInfoTabs
                                key={activeConversationId}
                                participants={groupInfo.participants}
                                conversationId={activeConversationId!}
                                type={groupInfo.type}
                                currentUserRole={groupInfo.currentUserRole}
                                onRemoveMember={handleRemoveMember}
                                onPromoteMember={handlePromoteMember}
                            />
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            Không thể tải thông tin
                        </div>
                    )}
                </div>

                {/* Add Member Dialog */}
                {activeConversationId && groupInfo && (
                    <>
                        <AddMemberDialog
                            open={addMemberOpen}
                            onOpenChange={setAddMemberOpen}
                            conversationId={activeConversationId}
                            existingMemberIds={groupInfo.participants.map(p => p.userId)}
                            onMembersAdded={loadGroupInfo}
                        />

                        <TransferOwnershipDialog
                            open={transferOwnershipOpen}
                            onOpenChange={setTransferOwnershipOpen}
                            conversationId={activeConversationId}
                            members={groupInfo.participants.filter(p => p.role !== "owner")}
                            onTransferred={() => {
                                loadGroupInfo();
                                setTransferOwnershipOpen(false);
                            }}
                        />
                    </>
                )}
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
                        <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                confirmDialog.onConfirm();
                                setConfirmDialog(prev => ({ ...prev, open: false }));
                            }}
                            className={confirmDialog.variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                        >
                            Xác nhận
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Alert Dialog */}
            <AlertDialog open={alertDialog.open} onOpenChange={(open) => setAlertDialog(prev => ({ ...prev, open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{alertDialog.title}</AlertDialogTitle>
                        <AlertDialogDescription>{alertDialog.message}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setAlertDialog(prev => ({ ...prev, open: false }))}>
                            Đóng
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Group Dialog */}
            <Dialog open={editGroupOpen} onOpenChange={setEditGroupOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Sửa thông tin nhóm</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={editAvatarPreview || getImageUrl(undefined)} />
                                    <AvatarFallback className="text-2xl">
                                        {editName?.charAt(0)?.toUpperCase() || "G"}
                                    </AvatarFallback>
                                </Avatar>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="secondary"
                                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-md"
                                    onClick={() => avatarInputRef.current?.click()}
                                >
                                    <Camera className="h-4 w-4" />
                                </Button>
                            </div>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarSelect}
                            />
                            <span className="text-xs text-muted-foreground">Nhấn để thay đổi ảnh nhóm</span>
                        </div>

                        {/* Group Name */}
                        <div className="space-y-2">
                            <Label htmlFor="groupName">Tên nhóm</Label>
                            <Input
                                id="groupName"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Nhập tên nhóm"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditGroupOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleSaveGroupEdit} disabled={isUpdating || !editName.trim()}>
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Lưu
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
