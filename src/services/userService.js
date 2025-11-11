// src/services/userService.js
import { db } from "@/config/firebase.js";
import {
  collection,
  getDocs,
  query,
  doc,
  updateDoc,
  deleteDoc,
  runTransaction,
  getDoc,
} from "firebase/firestore";

const usersCollectionRef = collection(db, "users");

export const getUsers = async () => {
  try {
    const q = query(usersCollectionRef);
    const querySnapshot = await getDocs(q);
    const users = querySnapshot.docs.map((doc) => ({
      id: doc.id, // UID
      ...doc.data(),
    }));
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const updateUser = async (id, updatedData) => {
  try {
    const userDoc = doc(db, "users", id);
    await updateDoc(userDoc, updatedData);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  const userDocRef = doc(db, "users", userId);
  const dutyRotationRef = doc(db, "team_meta", "duty_rotation");

  try {
    await runTransaction(db, async (transaction) => {
      const dutySnap = await transaction.get(dutyRotationRef);
      if (dutySnap.exists()) {
        const dutyData = dutySnap.data();
        const currentOrder = dutyData.memberOrder || [];
        const newMemberOrder = currentOrder.filter(id => id !== userId);
        
        transaction.update(dutyRotationRef, { memberOrder: newMemberOrder, currentIndex: 0 }); // Reset index
      }
      transaction.delete(userDocRef);
    });
  } catch (error) {
    console.error("Giao dịch xóa user thất bại:", error);
    throw error;
  }
};