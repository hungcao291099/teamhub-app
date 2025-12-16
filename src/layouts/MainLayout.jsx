// src/layouts/MainLayout.jsx
import { Outlet, NavLink, useNavigate, Link, useLocation } from "react-router-dom"; // Thêm useLocation
import {
  Users,
  DollarSign,
  LayoutDashboard,
  AppWindow,
  LogOut, // Thêm icon Đăng xuất
  User,    // Thêm icon User (cho mobile)
  UserCircle
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth.js"; // Import hook Auth
import { Button } from "@/components/ui/button"; // Import Button
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"; // Import Dropdown

import { PageTransition } from "@/components/common/PageTransition"; // Import PageTransition
import { LiquidNavBar } from "@/components/liquid/LiquidNavBar";
import { LiquidSideBar, LiquidSideBarItem } from "@/components/liquid/LiquidSideBar";
import { ChatButton } from "@/features/chat/components/ChatButton";

// Danh sách các link nav (đã xóa Xoay tua)
const navItems = [
  { to: "/", label: "Tổng quan", icon: LayoutDashboard },
  { to: "/members", label: "Người dùng", icon: Users },
  { to: "/fund", label: "Sổ quỹ", icon: DollarSign },
  { to: "/utilities", label: "Tiện ích", icon: AppWindow },
];

export function MainLayout() {
  // --- THÊM LOGIC ĐĂNG XUẤT ---
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      // Chuyển về trang login sau khi đăng xuất
      navigate('/login');
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
  };
  // --- HẾT LOGIC ĐĂNG XUẤT ---

  const location = useLocation(); // Lấy vị trí hiện tại cho animation key

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex min-h-screen bg-transparent">

        {/* --- SIDEBAR (Desktop) - REPLACED WITH LIQUID SIDEBAR --- */}
        <LiquidSideBar
          items={navItems}
          header={
            <div className="flex items-center justify-center">
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">TeamHub</h1>
            </div>
          }
          footer={
            <div className="space-y-4">
              <ChatButton />
              <LiquidSideBarItem
                item={{ to: "/account", label: "Tài khoản của tôi", icon: UserCircle }}
              />
              <LiquidSideBarItem
                item={{ label: "Đăng xuất", icon: LogOut }}
                onClick={handleLogout}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
              />
            </div>
          }
        />

        <div className="flex-1 flex flex-col overflow-hidden">

          {/* --- HEADER (Mobile) - GLASS --- */}
          <header className="h-16 flex md:hidden items-center justify-between p-4 glass border-b-0 sticky top-0 z-10">
            <h1 className="text-2xl font-bold text-blue-600">TeamHub</h1>

            {/* NÚT ĐĂNG XUẤT (MOBILE) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/account">
                    <UserCircle className="h-4 w-4 mr-2" />
                    Tài khoản của tôi
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                  <LogOut className="h-4 w-4 mr-2" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
            <Outlet />
          </main>

          {/* --- BOTTOM NAV (Mobile) - LIQUID DOCK --- */}
          <div className="md:hidden">
            <LiquidNavBar items={navItems} />
          </div>
        </div>

      </div>
    </TooltipProvider>
  );
}

// ... (Component DesktopNavLink và MobileNavLink giữ nguyên)
// (Bạn có thể sao chép lại 2 component này từ file cũ nếu cần)

// Component con cho link Desktop
const DesktopNavLink = ({ to, label, icon: Icon }) => (
  <NavLink
    to={to}
    className="relative flex items-center space-x-3 px-4 py-2 rounded-md transition-all group"
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <motion.div
            layoutId="active-nav-desktop"
            className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-md shadow-lg shadow-blue-500/30"
            initial={false}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        <div className={`relative z-10 flex items-center space-x-3 ${isActive ? "text-white" : "text-muted-foreground group-hover:text-blue-600"}`}>
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </div>
      </>
    )}
  </NavLink>
);

// Component con cho link Mobile
const MobileNavLink = ({ to, label, icon: Icon }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `relative flex flex-col items-center justify-center h-full w-full p-2 
       transition-colors
       ${isActive ? "text-primary" : "text-muted-foreground hover:text-primary/80"}
      `
    }
  >
    {({ isActive }) => (
      <>
        <Icon className="h-6 w-6" />
        <span className="text-xs mt-1">{label}</span>

        {isActive && (
          <motion.div
            layoutId="active-nav-indicator"
            className="absolute bottom-0 left-0 right-0 h-1 bg-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
      </>
    )}
  </NavLink>
);