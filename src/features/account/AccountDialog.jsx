import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth.js";
import { getCaLamViecByUser, chamCong } from "@/services/hrmApiService";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarWithFrame } from "@/components/ui/avatar-with-frame";
import { Label } from "@/components/ui/label";
import { LogIn, LogOut, Loader2 } from "lucide-react";
import { EditAccountForm } from "@/features/account/EditAccountForm.jsx";
import { ChangePasswordDialog } from "@/features/account/ChangePasswordDialog.jsx";
import { Separator } from "@/components/ui/separator";

export function AccountDialog({ open, onOpenChange }) {
    const { currentUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);

    // Work shift states
    const [caLamViec, setCaLamViec] = useState(null);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

    // Reset editing state when dialog closes
    useEffect(() => {
        if (!open) {
            setIsEditing(false);
        }
    }, [open]);

    // Load work shifts when dialog opens, tokenA exists or selectedShiftMa changes
    useEffect(() => {
        if (open && currentUser?.tokenA) {
            loadCaLamViec();
        }
    }, [open, currentUser?.tokenA, currentUser?.selectedShiftMa]);

    const loadCaLamViec = async () => {
        try {
            const result = await getCaLamViecByUser();
            if (result.Status === "OK" && result.Data) {
                // Parse Data if it's a string
                const shifts = typeof result.Data === 'string' ? JSON.parse(result.Data) : result.Data;

                if (Array.isArray(shifts) && shifts.length > 0) {
                    // Priority: find shift that user has selected
                    if (currentUser?.selectedShiftMa) {
                        const selectedShift = shifts.find(shift => shift.Ma === currentUser.selectedShiftMa);
                        if (selectedShift) {
                            setCaLamViec(selectedShift);
                            return;
                        }
                    }
                    // Fallback to first shift
                    setCaLamViec(shifts[0]);
                }
            }
        } catch (error) {
            console.error("Failed to load work shifts:", error);
        }
    };

    const handleCheckIn = async () => {
        if (!currentUser?.tokenA || !caLamViec) return;
        setIsCheckingIn(true);
        try {
            const result = await chamCong(caLamViec.Ma, "1");
            if (result.Status === "OK") {
                toast.success("Vào ca thành công!");
            } else {
                toast.error(result.Messenge || "Vào ca thất bại");
            }
        } catch (error) {
            toast.error("Vào ca thất bại");
        } finally {
            setIsCheckingIn(false);
        }
    };

    const handleCheckOut = async () => {
        if (!currentUser?.tokenA || !caLamViec) return;
        setIsCheckingOut(true);
        try {
            const result = await chamCong(caLamViec.Ma, "0");
            if (result.Status === "OK") {
                toast.success("Ra ca thành công!");
            } else {
                toast.error(result.Messenge || "Ra ca thất bại");
            }
        } catch (error) {
            toast.error("Ra ca thất bại");
        } finally {
            setIsCheckingOut(false);
        }
    };

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
                        <AvatarWithFrame frameId={currentUser.selectedFrame} size="xl">
                            <Avatar className="w-24 h-24 md:w-32 md:h-32">
                                <AvatarImage
                                    src={currentUser.avatarUrl || `https://i.pravatar.cc/150?u=${currentUser.id}`}
                                    alt={currentUser.name}
                                />
                                <AvatarFallback className="text-4xl">
                                    {currentUser.name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                        </AvatarWithFrame>
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

                                {/* Chấm công section - Only show if user has tokenA */}
                                {currentUser.tokenA && (
                                    <>
                                        <Separator />
                                        <div className="space-y-3">
                                            <Label className="text-lg font-semibold">Chấm công</Label>
                                            {caLamViec && (
                                                <p className="text-sm text-muted-foreground">
                                                    Ca: {caLamViec.Ten} ({caLamViec.Code})
                                                </p>
                                            )}
                                            <div className="flex flex-wrap gap-3">
                                                <Button
                                                    onClick={handleCheckIn}
                                                    disabled={isCheckingIn || !caLamViec}
                                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                                >
                                                    {isCheckingIn ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <LogIn className="mr-2 h-4 w-4" />
                                                    )}
                                                    Vào ca
                                                </Button>
                                                <Button
                                                    onClick={handleCheckOut}
                                                    disabled={isCheckingOut || !caLamViec}
                                                    variant="destructive"
                                                    className="flex-1"
                                                >
                                                    {isCheckingOut ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <LogOut className="mr-2 h-4 w-4" />
                                                    )}
                                                    Ra ca
                                                </Button>
                                            </div>
                                            {!caLamViec && (
                                                <p className="text-sm text-yellow-600">
                                                    Đang tải ca làm việc...
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}
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
