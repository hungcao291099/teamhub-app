// src/features/account/EditAccountForm.jsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { updateUser, uploadAvatar } from "@/services/userService";
import { AvatarCropDialog } from "./AvatarCropDialog";
import { Camera, X } from "lucide-react";
import { frameList, frameMap, AvatarWithFrame } from "@/components/ui/avatar-with-frame";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Form này được nhúng trực tiếp, không phải Dialog
export function EditAccountForm({ user, onSave, onCancel }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageToEdit, setImageToEdit] = useState(null);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: user.name,
      avatar: user.avatarUrl || "",
      tokenA: user.tokenA || "",
      selectedFrame: user.selectedFrame || "",
    }
  });

  // Tải lại defaultValues nếu user prop thay đổi
  useEffect(() => {
    reset({
      name: user.name,
      avatar: user.avatarUrl || "", // Note: backend sends avatarUrl
      tokenA: user.tokenA || "",
      selectedFrame: user.selectedFrame || "",
    });
  }, [user, reset]);

  // Handle file selection - open crop dialog instead of uploading immediately
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh không được vượt quá 5MB");
      return;
    }

    // Open crop dialog
    setImageToEdit(file);
    setShowCropDialog(true);

    // Reset file input so the same file can be selected again
    e.target.value = "";
  };

  // Handle cropped image upload
  const handleCropComplete = async (croppedFile) => {
    console.log("handleCropComplete called with file:", croppedFile);
    console.log("File size:", croppedFile.size, "bytes");
    console.log("File type:", croppedFile.type);

    try {
      setUploading(true);
      setShowCropDialog(false);
      console.log("Uploading avatar...");
      const res = await uploadAvatar(croppedFile);
      console.log("Upload response:", res);
      setValue("avatar", res.avatarUrl);
      toast.success("Tải ảnh lên thành công!");
    } catch (error) {
      console.error("Upload failed", error);
      console.error("Error details:", error.response?.data || error.message);
      toast.error("Upload ảnh thất bại");
    } finally {
      setUploading(false);
      setImageToEdit(null);
    }
  };

  const handleCropDialogClose = (open) => {
    if (!open) {
      setShowCropDialog(false);
      setImageToEdit(null);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Map 'avatar' form field to 'avatarUrl' expected by backend
      const userData = {
        name: data.name,
        avatarUrl: data.avatar,
        tokenA: data.tokenA,
        selectedFrame: data.selectedFrame || null,
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
    <>
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

          {/* Preview with overlay button */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={currentAvatar || `https://i.pravatar.cc/150?u=${user.id}`}
                alt="Preview"
                className="w-20 h-20 rounded-full object-cover border"
              />
              {/* Overlay for changing avatar */}
              <label
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                htmlFor="avatar-input"
              >
                <Camera className="h-6 w-6 text-white" />
              </label>
              <input
                id="avatar-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="avatar-input"
                className="text-sm text-primary hover:underline cursor-pointer"
              >
                {uploading ? "Đang tải lên..." : "Thay đổi ảnh đại diện"}
              </label>
              <span className="text-xs text-muted-foreground">
                JPG, PNG hoặc GIF (Tối đa 5MB)
              </span>
            </div>
          </div>
          {/* Hidden input to store URL */}
          <input type="hidden" {...register("avatar")} />
        </div>

        {/* Frame Selection */}
        <div className="space-y-2">
          <Label>Khung avatar</Label>
          <div className="flex items-start gap-4">
            {/* Preview */}
            <div className="shrink-0">
              <AvatarWithFrame frameId={watch("selectedFrame") || null} size="lg">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={currentAvatar || `https://i.pravatar.cc/150?u=${user.id}`} />
                  <AvatarFallback className="text-2xl">{user.name?.[0]}</AvatarFallback>
                </Avatar>
              </AvatarWithFrame>
            </div>

            {/* Frame Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-5 gap-2">
                {/* No frame option */}
                <button
                  type="button"
                  onClick={() => setValue("selectedFrame", "")}
                  className={`relative w-12 h-12 rounded-lg border-2 transition-all hover:scale-105 hover:border-primary/50 flex items-center justify-center ${!watch("selectedFrame")
                      ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2"
                      : "border-border bg-muted/30"
                    }`}
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>

                {frameList.map((frame) => (
                  <button
                    key={frame.id}
                    type="button"
                    onClick={() => setValue("selectedFrame", frame.id)}
                    className={`relative w-12 h-12 rounded-lg border-2 transition-all hover:scale-105 hover:border-primary/50 p-0.5 ${watch("selectedFrame") === frame.id
                        ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2"
                        : "border-border bg-muted/30"
                      }`}
                  >
                    <img
                      src={frame.src}
                      alt={frame.id}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground mt-2 block">
                Chọn khung để trang trí avatar
              </span>
            </div>
          </div>
          <input type="hidden" {...register("selectedFrame")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tokenA">Token A</Label>
          <Input
            id="tokenA"
            type="password"
            placeholder="Nhập token A..."
            {...register("tokenA")}
          />
          <span className="text-xs text-muted-foreground">
            Token dùng cho việc gọi API bên ngoài
          </span>
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

      {/* Avatar Crop Dialog */}
      <AvatarCropDialog
        open={showCropDialog}
        onOpenChange={handleCropDialogClose}
        imageFile={imageToEdit}
        onCropComplete={handleCropComplete}
      />
    </>
  );
}
