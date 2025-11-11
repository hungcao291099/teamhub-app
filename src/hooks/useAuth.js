// src/hooks/useAuth.js
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext.jsx"; // Thêm .jsx

export const useAuth = () => {
  return useContext(AuthContext);
};