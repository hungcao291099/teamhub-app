import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth.js";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { EditAccountForm } from "@/features/account/EditAccountForm.jsx";
import { ChangePasswordDialog } from "@/features/account/ChangePasswordDialog.jsx";
import { Separator } from "@/components/ui/separator";

export function AccountDialog({ open, onOpenChange }) {
    const { currentUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);

    // Reset editing state when dialog closes
    useEffect(() => {
        if (!open) {
            setIsEditing(false);
        }
    }, [open]);

    if (!currentUser) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] md:max-w-2xl bg-card border-border">
                <DialogHeader>
                    <DialogTitle>Tài khoản của tôi</DialogTitle>
                    <DialogDescription>
                        Quản lý thông tin cá nhân và bảo mật.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col md:flex-row gap-6 py-4">
                    {/* Left Column: Avatar & Basic Info */}
                    <div className="flex flex-col items-center gap-4 md:w-1/3 border-r border-border pr-0 md:pr-6">
                        <Avatar className="w-24 h-24 md:w-32 md:h-32">
                            <AvatarImage
                                src={currentUser.avatarUrl || `https://i.pravatar.cc/150?u=${currentUser.id}`}
                                alt={currentUser.name}
                            />
                            <AvatarFallback className="text-4xl">
                                {currentUser.name?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                            <h3 className="text-xl font-semibold">{currentUser.name}</h3>
                            <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
                            <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                                {currentUser.role}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details & Actions */}
                    <div className="flex-1 space-y-4">
                        {isEditing ? (
                            <EditAccountForm
                                user={currentUser}
                                onSave={() => setIsEditing(false)}
                                onCancel={() => setIsEditing(false)}
                            />
                        ) : (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="grid gap-1">
                                        <Label className="text-muted-foreground">Họ và tên</Label>
                                        <div className="font-medium">{currentUser.name}</div>
                                    </div>
                                    <Separator />
                                    <div className="grid gap-1">
                                        <Label className="text-muted-foreground">Tên đăng nhập</Label>
                                        <div className="font-medium">{currentUser.username}</div>
                                    </div>
                                    <Separator />
                                </div>

                                <div className="flex flex-wrap gap-3 pt-2">
                                    <Button onClick={() => setIsEditing(true)} className="flex-1">
                                        Chỉnh sửa thông tin
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => setShowPasswordDialog(true)}
                                        className="flex-1"
                                    >
                                        Đổi mật khẩu
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nested Dialog for Password Change */}
                <ChangePasswordDialog
                    open={showPasswordDialog}
                    onOpenChange={setShowPasswordDialog}
                />
            </DialogContent>
        </Dialog>
    );
}
