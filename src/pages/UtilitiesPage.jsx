import { motion } from "framer-motion";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Beer, ChevronRight, ClipboardPlus, ClipboardList, CalendarDays, Loader2, UserPlus } from "lucide-react";
import { findActiveParty } from "@/services/beerPartyService";
import { useAuth } from "@/hooks/useAuth.js";

// Animation
const pageAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export function UtilitiesPage() {
  const [checkingParty, setCheckingParty] = useState(false); // State loading
  const navigate = useNavigate();
  const { userDocument } = useAuth();
  const isAdmin = userDocument?.role === 'admin';

  const handleBeerCounterClick = async () => {
    setCheckingParty(true);
    try {
      const activePartyId = await findActiveParty();
      
      if (activePartyId) {
        // TÌM THẤY: Đi thẳng vào bữa tiệc
        navigate(`/utilities/beer-party/${activePartyId}`);
      } else {
        // KHÔNG TÌM THẤY: Đi đến trang setup
        navigate("/utilities/beer-counter-setup");
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra tiệc:", error);
      setCheckingParty(false); // Dừng loading nếu lỗi
    }
  };

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
      id: "calendar", // Thêm ID
      to: "/utilities/team-calendar",
      title: "Lịch Sự kiện Team",
      description: "Xem và thêm các sự kiện chung của team.",
      icon: CalendarDays,
    },
    {
      id: "beer-wheel", // Thêm ID
      to: "/utilities/beer-wheel",
      title: "Vòng quay Uống bia",
      description: "Trò chơi vòng quay may mắn cho các buổi nhậu.",
      icon: Beer,
    },
    {
      id: "beer-counter", // Thêm ID
      // Bỏ 'to:' vì đã có 'action'
      title: "BeerTogether (Đếm bia)",
      description: "Tạo hoặc tham gia bảng đếm bia real-time.", // Sửa mô tả
      icon: ClipboardPlus,
      action: handleBeerCounterClick, // Giờ đã hợp lệ
      isLoading: checkingParty,       // Giờ đã hợp lệ
    },
  ];
    const adminUtilities = [
        {
        id: "invite",
        to: "/utilities/invite",
        title: "Mời thành viên",
        description: "Thêm email vào danh sách được phép đăng ký.",
        icon: UserPlus,
        }
    ];
  return (
    <motion.div
      variants={pageAnimation}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.2 }}
    >
      <h1 className="text-3xl font-bold mb-6">Tiện ích</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sửa lại key={util.id} */}
        {utilities.map((util) => (
          <UtilityCard key={util.id} {...util} />
        ))}
        {isAdmin && adminUtilities.map((util) => (
          <UtilityCard key={util.id} {...util} />
        ))}
      </div>
    </motion.div>
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