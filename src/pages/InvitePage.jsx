// src/pages/InvitePage.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth.js";
import { streamInvitations, addInvitation, deleteInvitation } from "@/services/invitationService.js";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// Animation
const pageAnimation = { /* ... */ };

// Schema xác thực email
const inviteSchema = z.object({
  email: z.string().email("Email không hợp lệ."),
});

export function InvitePage() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userDocument } = useAuth(); // Để lấy tên Admin
  
  const form = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "" },
  });

  // "Nghe" (stream) danh sách mời
  useEffect(() => {
    setLoading(true);
    const unsubscribe = streamInvitations((data) => {
      setInvites(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Xử lý Gửi lời mời
  const onSubmit = async (data) => {
    try {
      await addInvitation(data.email, userDocument?.name || "Admin");
      form.reset(); // Xóa form
    } catch (error) {
      console.error("Lỗi khi thêm lời mời:", error);
      form.setError("email", { message: "Đã xảy ra lỗi." });
    }
  };

  // Xử lý Xóa lời mời
  const handleDelete = async (email) => {
    try {
      await deleteInvitation(email);
    } catch (error) {
      console.error("Lỗi khi xóa lời mời:", error);
    }
  };

  return (
    <motion.div variants={pageAnimation} initial="initial" animate="animate">
      <Button asChild variant="outline" className="mb-4">
        <Link to="/utilities">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Quay lại danh sách
        </Link>
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cột 1: Form Thêm mới */}
        <Card>
          <CardHeader>
            <CardTitle>Mời thành viên mới</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Input
                placeholder="example@gmail.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Đang mời..." : "Gửi lời mời"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Cột 2: Danh sách đã mời */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách đang chờ (Đã mời)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <Skeleton className="h-20 w-full" />}
            {!loading && invites.length === 0 && (
              <p className="text-muted-foreground">Chưa có ai trong danh sách chờ.</p>
            )}
            <div className="space-y-3">
              {invites.map((invite) => (
                <div key={invite.email} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    
                    {/* Hiển thị status */}
                    {invite.status === 'pending' ? (
                      <p className="text-sm text-yellow-500">
                        Đang chờ đăng ký...
                      </p>
                    ) : (
                      <p className="text-sm text-green-500">
                        Đã sử dụng (bởi user {invite.claimedBy.substring(0, 5)}...)
                      </p>
                    )}
                    
                  </div>
                  {/* Chỉ cho xóa nếu đang chờ */}
                  {invite.status === 'pending' && (
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(invite.email)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}