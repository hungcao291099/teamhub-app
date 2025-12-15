import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteMessageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isDeleting?: boolean;
}

export const DeleteMessageDialog: React.FC<DeleteMessageDialogProps> = ({
    open,
    onOpenChange,
    onConfirm,
    isDeleting = false,
}) => {
    const handleConfirm = () => {
        onConfirm();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Xóa tin nhắn
                    </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                    Bạn có chắc chắn muốn xóa tin nhắn này? Hành động này không thể hoàn tác.
                </p>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                    <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
                        {isDeleting ? "Đang xóa..." : "Xóa"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
