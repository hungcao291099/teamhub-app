import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createUser } from "@/services/userService";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function AddUserDialog({ open, onOpenChange, onUserCreated }) {
    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        defaultValues: {
            role: "member",
        },
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const onSubmit = async (data) => {
        setLoading(true);
        setError(null);
        try {
            await createUser(data);
            toast.success("Thêm thành viên thành công!");
            reset();
            onOpenChange(false);
            if (onUserCreated) {
                onUserCreated();
            }
        } catch (err) {
            console.error(err);
            toast.error("Không thể tạo người dùng. Email/Username có thể đã tồn tại.");
            setError("Không thể tạo người dùng. Email hoặc username có thể đã tồn tại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Thêm thành viên mới</DialogTitle>
                    <DialogDescription>
                        Tạo tài khoản mới cho thành viên team.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && <div className="text-red-500 text-sm">{error}</div>}

                    <div className="space-y-2">
                        <Label htmlFor="name">Tên hiển thị</Label>
                        <Input id="name" {...register("name", { required: true })} placeholder="Nguyen Van A" />
                        {errors.name && <span className="text-red-500 text-xs">Bắt buộc</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="username">Username (Đăng nhập)</Label>
                        <Input id="username" {...register("username", { required: true })} placeholder="user123" />
                        {errors.username && <span className="text-red-500 text-xs">Bắt buộc</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Mật khẩu</Label>
                        <Input id="password" type="password" {...register("password", { required: true, minLength: 1 })} />
                        {errors.password && <span className="text-red-500 text-xs">Bắt buộc</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Vai trò</Label>
                        <Select onValueChange={(val) => setValue("role", val)} defaultValue="member">
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn vai trò" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="member">Thành viên (Member)</SelectItem>
                                <SelectItem value="admin">Quản trị viên (Admin)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Đang tạo..." : "Tạo mới"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
