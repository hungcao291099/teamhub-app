// src/features/account/ChangePasswordDialog.jsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Schema xác thực
const passwordSchema = z.object({
  password: z.string().min(1, "Vui lòng nhập mật khẩu cũ"),
  newPassword: z.string().min(6, "Mật khẩu mới phải ít nhất 6 ký tự"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu mới không khớp",
  path: ["confirmPassword"],
});

export function ChangePasswordDialog({ open, onOpenChange }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { reauthenticateAndChangePassword } = useAuth();
  
  const form = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = async (data) => {
    setError("");
    setSuccess("");
    try {
      await reauthenticateAndChangePassword(data.password, data.newPassword);
      setSuccess("Đổi mật khẩu thành công! Tự động đóng sau 2s.");
      
      // Tự động đóng dialog sau 2 giây
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);

    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setError("Mật khẩu cũ không chính xác.");
      } else {
        setError("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
      console.error(err);
    }
  };

  // Reset form khi dialog đóng/mở
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        form.reset();
        setError("");
        setSuccess("");
      }, 300); // Thêm độ trễ để tránh giật
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đổi Mật khẩu</DialogTitle>
          <DialogDescription>
            Bạn cần nhập mật khẩu cũ để tạo mật khẩu mới.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu cũ</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu mới</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">{success}</p>}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Đang lưu..." : "Đổi mật khẩu"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}