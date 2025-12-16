// src/features/users/UserList.jsx
import { useState, useEffect } from "react";
import { getUsers } from "@/services/userService.js"; // Sửa
import { UserCard } from "./UserCard.jsx"; // Sửa
import { UserListSkeleton } from "./UserListSkeleton";
import { useAuth } from "@/hooks/useAuth.js";
import { AddUserDialog } from "./AddUserDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ScrollHideFab } from "@/components/common/ScrollHideFab";

export function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const { currentUser, socket } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  // Listen for online users updates
  useEffect(() => {
    if (!socket) return;

    const handleOnlineUsers = (userIds) => {
      setOnlineUserIds(userIds);
    };

    socket.on("users:online", handleOnlineUsers);

    return () => {
      socket.off("users:online", handleOnlineUsers);
    };
  }, [socket]);

  useEffect(() => {
    // Chỉ fetch data NẾU user đã đăng nhập
    if (currentUser) {
      // Delay 300ms trước khi fetch để tránh giật lag khi chuyển nav nhanh
      const timeoutId = setTimeout(() => {
        const fetchUsers = async () => {
          try {
            setLoading(true);
            const data = await getUsers();
            setUsers(data);
            setError(null);
          } catch (err) {
            setError("Không thể tải danh sách người dùng.");
          } finally {
            setLoading(false);
          }
        };
        fetchUsers();
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      // Nếu user logout, dọn dẹp state
      setUsers([]);
      setLoading(false);
    }
  }, [currentUser]);

  // Realtime updates
  useEffect(() => {
    if (!socket) return;
    const handleUserUpdated = (updatedUser) => {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
    };
    socket.on("user:updated", handleUserUpdated);
    return () => {
      socket.off("user:updated", handleUserUpdated);
    };
  }, [socket]);

  const handleUserDeleted = (deletedUserId) => {
    setUsers((prevUsers) =>
      prevUsers.filter((user) => user.id !== deletedUserId)
    );
  };

  const handleUserUpdated = (updatedUserId, updatedData) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === updatedUserId
          ? { ...user, ...updatedData }
          : user
      )
    );
  };

  if (loading) return <UserListSkeleton />; // Thêm Skeleton của bạn
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Danh sách Người dùng
        </h1>
        {isAdmin && (
          <div className="hidden md:block">
            <Button onClick={() => setOpenAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Thêm người dùng
            </Button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="md:hidden">
          <ScrollHideFab icon={Plus} onClick={() => setOpenAddDialog(true)} className="bottom-24" />
        </div>
      )}

      <AddUserDialog
        open={openAddDialog}
        onOpenChange={setOpenAddDialog}
        onUserCreated={() => window.location.reload()} // Simple reload to refresh or refetch
      />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onUserDeleted={handleUserDeleted}
            onUserUpdated={handleUserUpdated}
            isAdmin={isAdmin}
            currentUserId={currentUser.id}
            isOnline={onlineUserIds.includes(user.id)}
          />
        ))}
      </div>
    </div>
  );
}