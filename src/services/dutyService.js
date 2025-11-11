// src/services/dutyService.js
import { db } from "@/config/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  where,
  query,
} from "firebase/firestore";
import { getUsers } from "@/services/userService";
const dutyRotationRef = doc(db, "team_meta", "duty_rotation");
const membersCollectionRef = collection(db, "members");

// Hàm lấy thông tin xoay tua VÀ thông tin thành viên
export const getRotationData = async () => {
  try {
    // 1. Lấy document xoay tua
    const dutySnap = await getDoc(dutyRotationRef);
    if (!dutySnap.exists()) {
      throw new Error("Không tìm thấy cấu hình xoay tua (duty_rotation)!");
    }
    const dutyData = dutySnap.data(); // { currentIndex: 0, memberOrder: [...] }

    // 2. Lấy thông tin các thành viên trong danh sách xoay tua
    // (Nếu memberOrder trống thì không làm gì cả)
    if (!dutyData.memberOrder || dutyData.memberOrder.length === 0) {
      return {
        ...dutyData,
        members: [], // Trả về mảng rỗng
      };
    }

    // Lấy thông tin chi tiết của các members
    const membersQuery = query(
      membersCollectionRef,
      where("__name__", "in", dutyData.memberOrder)
    );
    const membersSnap = await getDocs(membersQuery);
    const membersMap = {};
    membersSnap.docs.forEach((doc) => {
      membersMap[doc.id] = doc.data();
    });

    // 3. Sắp xếp member theo đúng thứ tự trong memberOrder
    const sortedMembers = dutyData.memberOrder.map((id) => ({
      id: id,
      ...membersMap[id],
    }));

    return {
      currentIndex: dutyData.currentIndex,
      members: sortedMembers, // Danh sách member đã được sắp xếp
    };
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu xoay tua:", error);
    throw error;
  }
};

// Hàm "Hoàn thành" và chuyển lượt
export const completeDutyTurn = async () => {
  try {
    // Lấy dữ liệu hiện tại (chúng ta có thể dùng transaction, nhưng ở đây dùng get/update)
    const dutySnap = await getDoc(dutyRotationRef);
    if (!dutySnap.exists()) {
      throw new Error("Không tìm thấy cấu hình xoay tua!");
    }
    
    const { currentIndex, memberOrder } = dutySnap.data();
    
    // Tính index mới, xoay vòng
    const newIndex = (currentIndex + 1) % memberOrder.length;

    // Cập nhật lại document
    await updateDoc(dutyRotationRef, {
      currentIndex: newIndex,
    });

    return newIndex; // Trả về index mới
  } catch (error) {
    console.error("Lỗi khi chuyển lượt:", error);
    throw error;
  }
};
export const updateRotationConfig = async (newMemberOrder) => {
  // newMemberOrder là mảng ID mới, đã được sắp xếp
  try {
    await updateDoc(dutyRotationRef, {
      memberOrder: newMemberOrder,
      currentIndex: 0, // Reset về 0 khi thay đổi danh sách
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật cấu hình xoay tua:", error);
    throw error;
  }
};

// Hàm MỚI: Lấy tất cả dữ liệu cần cho trang cấu hình
export const getConfigData = async () => {
  try {
    // Chạy song song 2 request
    const [allMembers, rotationData] = await Promise.all([
      getUsers(),        // Lấy tất cả member
      getRotationData(), // Lấy data xoay tua hiện tại
    ]);

    return { allMembers, rotationData };
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu cấu hình:", error);
    throw error;
  }
};