import api from "@/services/api";

export interface User {
    id: number;
    username: string; // Add username if missing
    name: string;
    avatarUrl?: string; // or avatar
    role: string;
    // password is optional interface for reading
    password?: string;
    tokenA?: string; // Token for external API calls
    selectedFrame?: string; // Avatar frame (frame1, frame2, etc.)
}

export const createUser = async (data: Partial<User>) => {
    const res = await api.post("/auth/create-user", data);
    return res.data;
};

export const getUsers = async () => {
    const res = await api.get("/users");
    return res.data;
};

// If needed
export const getUserById = async (id: number) => {
    const res = await api.get(`/users/${id}`);
    return res.data;
};

export const updateUser = async (id: number, data: Partial<User>) => {
    const res = await api.put(`/users/${id}`, data);
    return res.data;
};

export const deleteUser = async (id: number) => {
    const res = await api.delete(`/users/${id}`);
    return res.data;
};

export const uploadAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await api.post("/users/upload-avatar", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return res.data; // { avatarUrl: "..." }
};
// Polling to simulate real-time
export const streamCurrentUser = (userId: number, callback: (data: User) => void) => {
    // Initial fetch
    getUserById(userId).then(callback).catch(console.error);

    const intervalId = setInterval(async () => {
        try {
            const user = await getUserById(userId);
            callback(user);
        } catch (error) {
            console.error("Polling error:", error);
        }
    }, 5000); // 5 seconds

    return () => clearInterval(intervalId);
};

export const updatePassword = async (userId: number, data: any) => {
    const res = await api.put(`/users/${userId}/change-password`, data);
    return res.data;
};

export const resetPassword = async (userId: number) => {
    const res = await api.post(`/users/${userId}/reset-password`);
    return res.data;
};
