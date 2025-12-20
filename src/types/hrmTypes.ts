// Types for HRM API responses

// Ca làm việc (Work Shift)
export interface CaLamViec {
    Ma: string;
    Code: string;
    MaChiNhanh: string;
    Ten: string;
    GioVaoLan1: string | null;
    GioRaLan1: string | null;
    GioVaoLan2: string | null;
    GioRaLan2: string | null;
    GioVaoLan3: string | null;
    GioRaLan3: string | null;
    ThoiGianDiTreVeSom: number | null;
    SoGioLam: number | null;
    Status: string | null;
    UserCreated: string | null;
    CreatedDate: string | null;
    UserModified: string | null;
    ModifiedDate: string | null;
    Deleted: boolean | null;
    UserDeleted: string | null;
    DeletedDate: string | null;
    LaCaGay: boolean | null;
    TuDongTinhTangCa: boolean | null;
    MaLoaiCong: string | null;
    ChuNhatOff: boolean | null;
    SoGioLamViecQuyDinh: number | null;
    CaDem: boolean | null;
    SoGioNghiGiuaCa: number | null;
}

// Generic HRM API Response wrapper
export interface HrmApiResponse<T> {
    Status: string;
    Messenge: string;
    Data: string; // Data is JSON string that needs to be parsed
}

// Parsed response type
export interface ParsedHrmResponse<T> {
    Status: string;
    Messenge: string;
    Data: T;
}
