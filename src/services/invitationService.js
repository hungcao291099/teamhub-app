// src/services/invitationService.js
import { db } from "@/config/firebase.js";
import {
  collection,
  doc,
  setDoc, // Dùng setDoc để ghi đè (nếu trùng)
  deleteDoc,
  Timestamp,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";

const invCollectionRef = collection(db, "invitations");

// "Nghe" (stream) danh sách lời mời
export const streamInvitations = (callback) => {
  const q = query(invCollectionRef, orderBy("invitedAt", "desc"));
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const invites = [];
    querySnapshot.forEach((doc) => {
      invites.push({ 
        email: doc.id, // ID chính là email
        ...doc.data() 
      });
    });
    callback(invites);
  });
  return unsubscribe;
};

// Thêm lời mời mới
export const addInvitation = (email, adminName) => {
  const lowerCaseEmail = email.toLowerCase();
  const invDocRef = doc(db, "invitations", lowerCaseEmail);
  
  return setDoc(invDocRef, {
    invitedBy: adminName,
    invitedAt: Timestamp.now(),
    status: "pending" // <-- THÊM DÒNG NÀY
  });
};
// Xóa lời mời
export const deleteInvitation = (email) => {
  const lowerCaseEmail = email.toLowerCase();
  const invDocRef = doc(db, "invitations", lowerCaseEmail);
  return deleteDoc(invDocRef);
};