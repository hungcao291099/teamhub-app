// src/features/users/UserList.jsx
import { useState, useEffect } from "react";
import { getUsers } from "@/services/userService.js"; // Sửa
import { UserCard } from "./UserCard.jsx"; // Sửa
import { UserListSkeleton } from "./UserListSkeleton";
import { useAuth } from "@/hooks/useAuth.js";

export function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userDocument, currentUser } = useAuth();
  const isAdmin = userDocument?.role === 'admin';
  useEffect(() => {
    // Chỉ fetch data NẾU user đã đăng nhập
    if (currentUser) { 
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
    } else {
      // Nếu user logout, dọn dẹp state
      setUsers([]);
      setLoading(false);
    }
  }, [currentUser]);

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
        <h1 className="text-3xl font-bold">Danh sách Người dùng</h1>
        {/* Nút Thêm Mới đã bị xóa */}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user} // Prop có thể giữ tên cũ
            onUserDeleted={handleUserDeleted}
            onUserUpdated={handleUserUpdated}
            isAdmin={isAdmin}
            currentUserId={currentUser.uid}
          />
        ))}
      </div>
    </div>
  );
}