import { createContext, useState, useEffect, ReactNode, useContext } from "react";
import api from "@/services/api";

interface User {
  id: number;
  username: string;
  name: string;
  role: string;
  avatarUrl?: string; // Add other fields as needed
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  onlineUsers: number[];
  socket: Socket | null;
  // signup removed as user requested admin only
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

import { io, Socket } from "socket.io-client";

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);

  // Helper to init socket - socket.io auto-connects to current domain
  const connectSocket = (token: string) => {
    const newSocket = io({
      auth: { token },
      query: { clientType: "web" }
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
    });

    newSocket.on("auth:force_logout", (data) => {
      console.warn("Forced logout:", data.reason);
      logout();
      alert("Bạn đã bị đăng xuất (" + data.reason + ")");
    });

    newSocket.on("users:online", (users: number[]) => {
      console.log("Online users updated:", users);
      setOnlineUsers(users);
    });

    newSocket.on("user:updated", (data) => {
      // If updated user is me, update context
      setCurrentUser(prev => {
        if (prev && prev.id === data.userId) {
          return { ...prev, ...data };
        }
        return prev;
      });
    });

    setSocket(newSocket);
  };

  // Check login status on mount
  useEffect(() => {
    const checkLogin = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await api.get("/auth/me");
          setCurrentUser(res.data);
          connectSocket(token); // Connect socket
        } catch (error) {
          console.error("Token invalid or expired", error);
          localStorage.removeItem("token");
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };
    checkLogin();
  }, []);

  const login = async (username: string, password: string) => {
    const res = await api.post("/auth/login", { username, password });
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    setCurrentUser(user);
    connectSocket(token); // Connect socket
  };

  const logout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setOnlineUsers([]);
    window.location.href = "/login";
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
    socket, // Expose socket
    onlineUsers
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext); // Import useContext in next step or use React.useContext
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
