// src/features/duty/DutyRotation.jsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getRotationData, completeDutyTurn } from "@/services/dutyService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Phone, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DutyConfigDialog } from "./DutyConfigDialog";
import { DutyRotationSkeleton } from "./DutyRotationSkeleton";
import { useAuth } from "@/hooks/useAuth";
export function DutyRotation() {
  const [members, setMembers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getRotationData();
      setMembers(data.members);
      setCurrentIndex(data.currentIndex);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Delay 300ms trước khi fetch để tránh giật lag khi chuyển nav nhanh
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, []);

  const handleCompleteTurn = async () => {
    setIsUpdating(true);
    try {
      const newIndex = await completeDutyTurn();
      setCurrentIndex(newIndex);
      toast.success("Đã hoàn thành và chuyển lượt!");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi chuyển lượt. Thử lại sau!");
    } finally {
      setIsUpdating(false);
    }
  };
  const handleConfigSaved = () => {
    setOpenConfig(false); // Đóng Dialog
    fetchData(); // Tải lại dữ liệu mới
  };
  // Real-time updates
  const { socket } = useAuth();
  useEffect(() => {
    if (!socket) return;
    const handleDutyUpdate = () => {
      fetchData();
    };
    socket.on("duty:updated", handleDutyUpdate);
    return () => {
      socket.off("duty:updated", handleDutyUpdate);
    };
  }, [socket]);

  if (loading) return <DutyRotationSkeleton />;

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Xoay tua nhiệm vụ
        </h1>
        <div className="flex space-x-2 justify-end w-full md:w-auto">
          {/* 4. Nút Cấu hình (mở Dialog) */}
          {isAdmin && (
            <>
              <Dialog open={openConfig} onOpenChange={setOpenConfig}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl"> {/* Cho dialog rộng hơn */}
                  <DialogHeader>
                    <DialogTitle>Cấu hình xoay tua</DialogTitle>
                  </DialogHeader>
                  <DutyConfigDialog onSave={handleConfigSaved} />
                </DialogContent>
              </Dialog>

              <Button onClick={handleCompleteTurn} disabled={isUpdating}>
                {isUpdating ? "Đang chuyển..." : (
                  <>
                    <span className="hidden md:inline">Hoàn thành & Chuyển lượt</span>
                    <span className="md:hidden">Chuyển lượt</span>
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="space-y-4 p-4">
            {members.map((member, index) => {
              const isCurrentTurn = index === currentIndex;
              return (
                <div
                  key={member.id}
                  className={`flex items-center justify-between p-4 rounded-lg
                             ${isCurrentTurn ? "bg-blue-100 dark:bg-blue-900 border border-blue-500" : "bg-card"}`}
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={member.avatarUrl} />
                      <AvatarFallback>{member.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      {/* Phone removed */}
                    </div>
                  </div>
                  {isCurrentTurn && (
                    <div className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {members.length === 0 && (
        <p className="text-center text-muted-foreground mt-6">
          Chưa có thành viên nào trong danh sách xoay tua.
          <br />
          Vui lòng thêm ID thành viên vào `team_meta/duty_rotation` trên Firestore.
        </p>
      )}
    </div>
  );
}