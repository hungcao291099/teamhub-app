// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import { auth, db } from "@/config/firebase.js"; // Nhớ thêm .js
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ĐĂNG KÝ (Tạo user trong Auth và document trong Firestore)
  const signup = async (email, password, name, phone) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const defaultAvatar = `https://i.pravatar.cc/150?u=${user.uid}`;
    // Tạo document với ID là UID, và gán vai trò "member"
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      phone: phone || "",
      role: "member", // Vai trò mặc định
      avatar: defaultAvatar
    });
    return userCredential;
  };

  // ĐĂNG NHẬP
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // ĐĂNG XUẤT
  const logout = () => {
    return signOut(auth);
  };

  // RESET MẬT KHẨU
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};