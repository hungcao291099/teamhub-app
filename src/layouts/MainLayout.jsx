// src/layouts/MainLayout.jsx
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom"; // Thêm useNavigate
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

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex min-h-screen bg-background">
        
        {/* --- SIDEBAR (Desktop) - ĐÃ SỬA --- */}
        <aside className="hidden md:flex flex-col w-64 border-r">
          <div className="h-16 flex items-center justify-center border-b">
            <h1 className="text-2xl font-bold text-blue-600">TeamHub</h1>
          </div>

          {/* Sửa lại cấu trúc để đẩy nút Logout xuống dưới */}
          <div className="flex-1 flex flex-col justify-between p-4">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <DesktopNavLink key={item.to} to={item.to} label={item.label} icon={item.icon} />
              ))}
            </nav>
            <div>
              <DesktopNavLink 
                  to="/account" 
                  label="Tài khoản của tôi" 
                  icon={UserCircle} 
                  />
              {/* NÚT ĐĂNG XUẤT (DESKTOP) */}
              <Button variant="ghost" onClick={handleLogout} className="justify-start text-muted-foreground hover:text-red-500">
                <LogOut className="h-5 w-5 mr-3" />
                <span>Đăng xuất</span>
              </Button>

              </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* --- HEADER (Mobile) - ĐÃ SỬA --- */}
          <header className="h-16 flex md:hidden items-center justify-between p-4 border-b">
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
            <AnimatePresence mode="wait">
              <Outlet />
            </AnimatePresence>
          </main>

          {/* --- BOTTOM NAV (Mobile) --- */}
          <footer className="fixed bottom-0 left-0 right-0 md:hidden bg-background border-t">
            <nav className="flex justify-around items-center h-16 w-full">
              {navItems.map((item) => (
                <MobileNavLink key={item.to} to={item.to} label={item.label} icon={item.icon} />
              ))}
            </nav>
          </footer>
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
    className={({ isActive }) =>
      `flex items-center space-x-3 px-4 py-2 rounded-md transition-colors
       ${isActive
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`
    }
  >
    <Icon className="h-5 w-5" />
    <span>{label}</span>
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