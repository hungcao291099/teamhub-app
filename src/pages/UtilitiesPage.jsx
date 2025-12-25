import { NavLink } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronRight, ClipboardList, CalendarDays, Loader2, Sparkles, Gamepad2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth.js";

export function UtilitiesPage() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  // 🚀 DI CHUYỂN VÀO BÊN TRONG 🚀
  // Danh sách các tiện ích (ĐÃ SỬA)
  const utilities = [
    {
      id: "duty", // Thêm ID
      to: "/utilities/duty",
      title: "Xoay tua Nhiệm vụ",
      description: "Phân công nhiệm vụ xoay vòng.",
      icon: ClipboardList,
    },
    {
      id: "theme-event",
      to: "/utilities/theme-event",
      title: "Giao diện Sự kiện",
      description: "Trang trí ứng dụng theo các ngày lễ.",
      icon: Sparkles,
    },
    {
      id: "calendar", // Thêm ID
      to: "/utilities/team-calendar",
      title: "Lịch Sự kiện Team",
      description: "Xem và thêm các sự kiện chung của team.",
      icon: CalendarDays,
    },
    {
      id: "games",
      to: "/games",
      title: "Trò chơi",
      description: "Sò dép, đếm nút và các game đặt cược khác.",
      icon: Gamepad2,
    },
  ];

  return (
    <div>
      <h1 className="text-xl md:text-3xl font-bold mb-6">Tiện ích</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sửa lại key={util.id} */}
        {utilities.map((util) => (
          <UtilityCard key={util.id} {...util} />
        ))}

      </div>
    </div>
  );
}

// Component Card con (Không đổi)
function UtilityCard({ to, title, description, icon: Icon, action, isLoading }) {
  const content = (
    <CardHeader className="flex flex-row items-center justify-between space-y-0">
      <div className="space-y-1">
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" /> {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      {isLoading ? (
        <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
      ) : (
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      )}
    </CardHeader>
  );

  if (action) {
    return (
      <Card
        onClick={isLoading ? undefined : action}
        className="cursor-pointer hover:bg-accent transition-colors"
      >
        {content}
      </Card>
    );
  }

  return (
    <NavLink to={to}>
      <Card className="hover:bg-accent transition-colors">
        {content}
      </Card>
    </NavLink>
  );
}