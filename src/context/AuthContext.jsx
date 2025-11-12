// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import { auth, db } from "@/config/firebase.js"; // Nhớ thêm .js
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider
} from "firebase/auth";
import { doc, setDoc, onSnapshot, writeBatch, updateDoc, Timestamp } from "firebase/firestore";
import { streamCurrentUser } from "@/services/userService.js";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userDocument, setUserDocument] = useState(null);
  // Listener 1: Chỉ lắng nghe trạng thái Auth (Login/Logout)
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        // Nếu logout, xóa document và set loading false
        setUserDocument(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Listener 2: Lắng nghe Document (CHỈ KHI ĐÃ LOGIN)
  // Phụ thuộc vào [currentUser]
  useEffect(() => {
    // Nếu không có user (đã logout), không làm gì cả
    if (!currentUser) return; 

    // Nếu có user, bắt đầu "nghe" document
    setLoading(true); // Báo là đang tải data user
    
    const unsubscribeDoc = streamCurrentUser(currentUser.uid, (docData) => {
      setUserDocument(docData);
      setLoading(false); // Tải xong data
    });
    
    // Hàm dọn dẹp: Sẽ chạy khi currentUser bị đổi (logout)
    return () => unsubscribeDoc();

  }, [currentUser]);

  // ĐĂNG KÝ (Tạo user trong Auth và document trong Firestore)
  const signup = async (email, password, name, phone) => {
    // 1. Tạo user trong Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // 2. Tạo user document trong Firestore (Không cần batch)
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, {
      name: name,
      email: email,
      phone: phone || "",
      role: "member", // Role mặc định khi tự đăng ký
      avatar: `https://i.pravatar.cc/150?u=${user.uid}`
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
  const reauthenticateAndChangePassword = async (oldPassword, newPassword) => {
      if (!currentUser) throw new Error("Chưa đăng nhập");

      // 1. Lấy thông tin xác thực với mật khẩu CŨ
      const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);

      // 2. Xác thực lại
      await reauthenticateWithCredential(currentUser, credential);
      
      // 3. (Nếu xác thực thành công) Đặt mật khẩu MỚI
      await updatePassword(currentUser, newPassword);
    };
  const value = {
    currentUser,
    loading,
    userDocument,
    signup,
    login,
    logout,
    resetPassword,
    reauthenticateAndChangePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};