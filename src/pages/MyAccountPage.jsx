// src/pages/MyAccountPage.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth.js";
import { streamCurrentUser } from "@/services/userService";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarWithFrame } from "@/components/ui/avatar-with-frame";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { LogIn, LogOut, Loader2 } from "lucide-react";
import { EditAccountForm } from "@/features/account/EditAccountForm.jsx";
import { ChangePasswordDialog } from "@/features/account/ChangePasswordDialog.jsx";
// Animation
const pageAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export function MyAccountPage() {
  const { currentUser } = useAuth(); // Lấy user từ Auth
  const [userData, setUserData] = useState(null); // Data từ Firestore
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);


  // "Nghe" (stream) dữ liệu của user này
  // Sync realtime from Context to local state
  useEffect(() => {
    if (currentUser) {
      setUserData(currentUser);
      setLoading(false);

      setUserData(currentUser);
      setLoading(false);
    }
  }, [currentUser, currentUser?.selectedShiftMa, currentUser?.tokenA]);


  if (loading) {
    return <AccountSkeleton />; // Hiển thị skeleton
  }

  if (!userData) {
    return <div>Không tìm thấy dữ liệu người dùng.</div>;
  }

  return (
    <motion.div
      variants={pageAnimation}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold">Tài khoản của tôi</h1>

      {/* --- CARD THÔNG TIN CÁ NHÂN --- */}
      <Card className="max-w-3xl">
        {!isEditing && (
          <CardHeader className="flex flex-col items-center text-center">
            <div className="p-6 mb-4">
              <AvatarWithFrame frameId={userData.selectedFrame} size="xl">
                <Avatar className="w-32 h-32 mb-0 border-none shadow-none">
                  <AvatarImage
                    src={userData.avatarUrl || `https://i.pravatar.cc/150?u=${userData.id}`}
                    alt={userData.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-5xl border-none">
                    {userData.name?.[0]}
                  </AvatarFallback>
                </Avatar>
              </AvatarWithFrame>
            </div>
            <CardTitle className="text-3xl">{userData.name}</CardTitle>
            <CardDescription>@{userData.username}</CardDescription>
          </CardHeader>
        )}
        <CardContent className={isEditing ? "p-6" : "space-y-4"}>

          {isEditing ? (
            // --- DẠNG FORM SỬA ---
            <EditAccountForm
              user={userData}
              onSave={() => setIsEditing(false)}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            // --- DẠNG TEXT ĐỌC ---
            <>
              <div className="space-y-1">
                <Label>Vai trò (Role)</Label>
                <p className="font-medium capitalize">{userData.role}</p>
              </div>
              {/* Nhóm nút */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Button onClick={() => setIsEditing(true)}>
                  Chỉnh sửa thông tin
                </Button>
                <Button variant="secondary" onClick={() => setShowPasswordDialog(true)}>
                  Đổi mật khẩu
                </Button>
              </div>

            </>
          )}

        </CardContent>
      </Card>

      <ChangePasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
      />

    </motion.div>
  );
}

// Skeleton cho trang
function AccountSkeleton() {
  return (
    <div>
      <Skeleton className="h-9 w-64 mb-6" />
      <Card className="max-w-2xl">
        <CardHeader className="flex flex-col items-center text-center">
          <Skeleton className="w-32 h-32 rounded-full mb-4" />
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-56 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-10 w-40 mt-4" />
        </CardContent>
      </Card>
    </div>
  );
}