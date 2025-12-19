// src/features/members/EditUserDialog.jsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { updateUser } from "@/services/userService";

export function EditUserDialog({ user, onUserUpdated, open, onOpenChange, isAdmin }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm({
    defaultValues: {
      name: user.name,
      role: user.role || "member",
    }
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        role: user.role || "member",
      });
    }
  }, [user, form.reset]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const userData = {
        name: data.name,
        role: data.role,
      };

      await updateUser(user.id, userData);

      // Gọi hàm callback từ cha để cập nhật UI
      if (onUserUpdated) {
        onUserUpdated(user.id, userData); // Gửi ID và data mới
      }


      toast.success("Cập nhật thông tin thành công!");
      onOpenChange(false); // Đóng dialog
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error("Cập nhật thất bại. Vui lòng thử lại.");
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* 🚀 SỬA 3: Refactor "Tên" dùng FormField */}
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Tên là bắt buộc" }}
              render={({ field }) => (
                <FormItem className="grid grid-cols-4 items-center gap-x-4 gap-y-1">
                  <FormLabel className="text-right">Tên</FormLabel>
                  <FormControl className="col-span-3">
                    <Input id="name" {...field} />
                  </FormControl>
                  <FormMessage className="col-span-4 text-red-500 text-sm text-right" />
                </FormItem>
              )}
            />
            {/* Khối "Role" (Đã đúng) */}
            {isAdmin && (
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-x-4 gap-y-1">
                    <FormLabel className="text-right">Vai trò</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl className="col-span-3">
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn vai trò" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Quản trị</SelectItem>
                        <SelectItem value="accounting">Kế toán</SelectItem>
                        <SelectItem value="member">Thành viên</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="col-span-4 text-red-500 text-sm text-right" />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="mt-4">
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}