// HRM API Service - Calls backend proxy to avoid CORS
import api from "@/services/api";
import { CaLamViec, ParsedHrmResponse, HrmApiResponse } from "@/types/hrmTypes";

/**
 * Get work shifts (Ca làm việc) for current user
 * Calls backend proxy which uses user's tokenA from database
 */
export const getCaLamViecByUser = async (): Promise<ParsedHrmResponse<CaLamViec[]>> => {
    const response = await api.get<ParsedHrmResponse<CaLamViec[]>>("/hrm/ca-lam-viec");
    return response.data;
};

/**
 * Check-in or Check-out (Chấm công)
 * @param maCaLamViec - Work shift code (Ma field from CaLamViec)
 * @param vao - "1" for check-in (Vào), "0" for check-out (Ra)
 */
export const chamCong = async (
    maCaLamViec: string,
    vao: "1" | "0"
): Promise<HrmApiResponse<any>> => {
    const response = await api.post<HrmApiResponse<any>>("/hrm/cham-cong", {
        maCaLamViec,
        vao,
    });
    return response.data;
};
