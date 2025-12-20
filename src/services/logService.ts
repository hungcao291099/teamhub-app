import api from "@/services/api";

export interface AutoCheckInLog {
    id: number;
    userId: number;
    username: string;
    action: string;
    shiftCode: string;
    shiftName: string;
    scheduledTime: string;
    actualTime: string;
    status: string;
    response: string;
    createdAt: string;
}

export const getLogs = async (limit: number = 100): Promise<AutoCheckInLog[]> => {
    const res = await api.get(`/hrm/logs?limit=${limit}`);
    return res.data;
};

export const getUserLogs = async (userId: number, limit: number = 50): Promise<AutoCheckInLog[]> => {
    const res = await api.get(`/hrm/logs/${userId}?limit=${limit}`);
    return res.data;
};
