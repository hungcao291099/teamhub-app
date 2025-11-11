// src/components/common/ProtectedRoute.jsx
import { useAuth } from "@/hooks/useAuth.js";
import { Navigate, Outlet } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export function ProtectedRoute() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <Skeleton className="h-screen w-full" />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />; // Hiển thị MainLayout
}