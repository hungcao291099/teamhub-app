// src/features/account/EditAccountForm.jsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { updateUser, uploadAvatar } from "@/services/userService";

// Form này được nhúng trực tiếp, không phải Dialog
export function EditAccountForm({ user, onSave, onCancel }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: user.name,
      avatar: user.avatarUrl || "",
    }
  });

  // Tải lại defaultValues nếu user prop thay đổi
  useEffect(() => {
    reset({
      name: user.name,
      avatar: user.avatarUrl || "", // Note: backend sends avatarUrl
    });
  }, [user, reset]);

  // Handle file selection
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const res = await uploadAvatar(file);
      // res.avatarUrl is the new URL
      setValue("avatar", res.avatarUrl); // Update hidden field or state
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Upload ảnh thất bại");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Map 'avatar' form field to 'avatarUrl' expected by backend
      const userData = {
        name: data.name,
        avatarUrl: data.avatar,
      };

      await updateUser(user.id, userData);

      toast.success("Cập nhật hồ sơ thành công!");
      onSave(); // Gọi callback báo cha đã lưu (để tắt chế độ edit)
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error("Cập nhật hồ sơ thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentAvatar = watch("avatar");

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
        <Label>Ảnh đại diện</Label>

        {/* Preview */}
        {currentAvatar && (
          <div className="mb-2">
            <img src={currentAvatar} alt="Preview" className="w-20 h-20 rounded-full object-cover border" />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {uploading && <span className="text-xs text-muted-foreground">Đang tải lên...</span>}
        </div>
        {/* Hidden input to store URL */}
        <input type="hidden" {...register("avatar")} />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={isSubmitting || uploading}>
          {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  );
}