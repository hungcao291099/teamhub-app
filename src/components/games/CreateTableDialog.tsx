import { useState } from "react";
import { createTable } from "@/services/gamesService";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateTableDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    gameType: string;
    onCreated: () => void;
}

export function CreateTableDialog({ open, onOpenChange, gameType, onCreated }: CreateTableDialogProps) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Vui lòng nhập tên bàn");
            return;
        }

        setLoading(true);
        try {
            await createTable({
                gameType,
                name: name.trim()
            });
            toast.success("Đã tạo bàn thành công!");
            setName("");
            onCreated();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Không thể tạo bàn");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Tạo bàn mới</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Tên bàn</Label>
                        <Input
                            id="name"
                            placeholder="VD: Bàn của tôi"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <p className="text-sm text-muted-foreground">
                        💡 Đặt cược sẽ được thực hiện sau khi vào bàn, trước mỗi ván chơi.
                    </p>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Tạo bàn
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
