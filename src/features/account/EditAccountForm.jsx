// src/features/account/EditAccountForm.jsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { updateUser } from "@/services/userService.js";

// Form này được nhúng trực tiếp, không phải Dialog
export function EditAccountForm({ user, onSave, onCancel }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: user.name,
      phone: user.phone || "",
      avatar: user.avatar || "",
    }
  });

  // Tải lại defaultValues nếu user prop thay đổi
  useEffect(() => {
    reset({
      name: user.name,
      phone: user.phone || "",
      avatar: user.avatar || "",
    });
  }, [user, reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const userData = {
        ...data,
        avatar: data.avatar || `https://i.pravatar.cc/150?u=${data.name}`,
      };
      
      await updateUser(user.id, userData);
      
      onSave(); // Gọi callback báo cha đã lưu (để tắt chế độ edit)
    } catch (error) {
      console.error("Failed to update user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Tên</Label>
        <Input
          id="name"
          {...register("name", { required: "Tên là bắt buộc" })}
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Điện thoại</Label>
        <Input
          id="phone"
          {...register("phone")}
          type="tel"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="avatar">Link Avatar</Label>
        <Input
          id="avatar"
          {...register("avatar")}
          placeholder="Để trống để dùng ảnh ngẫu nhiên"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  );
}