// src/features/account/EditAccountForm.jsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { updateUser, uploadAvatar } from "@/services/userService";
import { AvatarCropDialog } from "./AvatarCropDialog";
import { Camera, X, Loader2 } from "lucide-react";
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
      selectedFrame: user.selectedFrame || "",
    }
  });

  // Tải lại defaultValues nếu user prop thay đổi
  useEffect(() => {
    reset({
      name: user.name,
      avatar: user.avatarUrl || "", // Note: backend sends avatarUrl
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
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
        <div className="flex flex-col md:flex-row gap-8 py-4">
          {/* Left Column: Unified Preview & Avatar Upload */}
          <div className="flex flex-col items-center gap-4 md:w-1/3 pr-0 md:pr-6 border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0">
            <Label className="text-sm font-semibold mb-2">Xem trước & Ảnh đại diện</Label>
            <div className="relative group shrink-0 p-4 flex items-center justify-center transition-all">
              <AvatarWithFrame frameId={watch("selectedFrame") || null} size="xl">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 mb-0 border-none shadow-none">
                  <AvatarImage src={currentAvatar || `https://i.pravatar.cc/150?u=${user.id}`} />
                  <AvatarFallback className="text-4xl border-none">{user.name?.[0]}</AvatarFallback>
                </Avatar>
              </AvatarWithFrame>

              {/* Unified Overlay for changing avatar - perfectly sized to avatar circle */}
              <label
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-20 m-4"
                htmlFor="avatar-input"
              >
                <div className="bg-background/20 backdrop-blur-sm p-3 rounded-full border border-white/20 shadow-xl">
                  <Camera className="h-8 w-8 text-white" />
                </div>
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
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Click ảnh để thay đổi</p>
              <p className="text-[10px] text-muted-foreground mt-1">Hỗ trợ JPG, PNG, GIF (Tối đa 5MB)</p>
            </div>
          </div>

          {/* Right Column: Name & Frame Selection Grid */}
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold">Tên hiển thị</Label>
              <Input
                id="name"
                {...register("name", { required: "Tên là bắt buộc" })}
                placeholder="Nhập tên của bạn"
                className="max-w-md"
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Chọn khung trang trí</Label>
                <button
                  type="button"
                  onClick={() => setValue("selectedFrame", "")}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Gỡ bỏ khung
                </button>
              </div>

              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar border rounded-lg p-3 bg-muted/5">
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {/* No frame option */}
                  <button
                    type="button"
                    onClick={() => setValue("selectedFrame", "")}
                    className={`relative aspect-square rounded-lg border-2 transition-all hover:scale-105 hover:border-primary/50 flex items-center justify-center ${!watch("selectedFrame")
                      ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2"
                      : "border-border bg-muted/30"
                      }`}
                  >
                    <X className="h-6 w-6 text-muted-foreground" />
                  </button>

                  {frameList.map((frame) => (
                    <button
                      key={frame.id}
                      type="button"
                      onClick={() => setValue("selectedFrame", frame.id)}
                      className={`relative aspect-square rounded-lg border-2 transition-all hover:scale-105 hover:border-primary/50 p-1 flex items-center justify-center ${watch("selectedFrame") === frame.id
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
              </div>
              <span className="text-xs text-muted-foreground italic block">
                * Cuộn để khám phá hơn 300+ khung từ Discord
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-border mt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Hủy
          </Button>
          <Button type="submit" disabled={isSubmitting || uploading} className="min-w-[120px]">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
        <input type="hidden" {...register("avatar")} />
        <input type="hidden" {...register("selectedFrame")} />
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
