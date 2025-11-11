// src/features/members/EditUserDialog.jsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { updateUser } from "@/services/userService";

export function EditUserDialog({ user, onUserUpdated, open, onOpenChange }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    // ĐIỂM QUAN TRỌNG: Lấy giá trị mặc định từ 'user'
    defaultValues: {
      name: user.name,
      phone: user.phone || "",
      avatar: user.avatar || "",
    }
  });

  // Reset form khi 'user' prop thay đổi (để đảm bảo form luôn đúng)
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        phone: user.phone || "",
        avatar: user.avatar || "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Dùng link ảnh avatar placeholder nếu người dùng xóa trống
      const userData = {
        ...data,
        avatar: data.avatar || `https://i.pravatar.cc/150?u=${data.name}`,
      };
      
      await updateUser(user.id, userData);
      
      // Gọi hàm callback từ cha để cập nhật UI
      if (onUserUpdated) {
        onUserUpdated(user.id, userData); // Gửi ID và data mới
      }
      
      onOpenChange(false); // Đóng dialog
    } catch (error) {
      console.error("Failed to update user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Dialog này được điều khiển (controlled) từ component cha
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sửa thông tin: {user.name}</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin cho thành viên này.
          </DialogDescription>
        </DialogHeader>
        
        {/* Đây là Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Tên
            </Label>
            <Input
              id="name"
              {...register("name", { required: "Tên là bắt buộc" })}
              className="col-span-3"
            />
            {errors.name && <p className="col-span-4 text-red-500 text-sm text-right">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
                Điện thoại
            </Label>
            <Input
                id="phone"
                {...register("phone")}
                className="col-span-3"
                type="tel"
            />
            </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="avatar" className="text-right">
              Link Avatar
            </Label>
            <Input
              id="avatar"
              {...register("avatar")}
              className="col-span-3"
              placeholder="Để trống để dùng ảnh ngẫu nhiên"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}