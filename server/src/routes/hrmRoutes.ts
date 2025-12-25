import { Router, Request, Response } from "express";
import axios from "axios";
import crypto from "crypto";
import { checkJwt } from "../middlewares/checkJwt";
import { checkRole } from "../middlewares/checkRole";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { AutoCheckInLog } from "../entities/AutoCheckInLog";

const router = Router();
const HRM_BASE_URL = "https://hrm.hungduy.vn";
const SIGN_KEY = "OroFGCABgqY2qzvK51fwLfXRSPbjjedP";

/**
 * Generate Sign parameter for check-in API
 * Sign = SHA512(Key + userMa + today in dd/MM/yyyy)
 */
function getSign(userMa: string): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const today = `${day}/${month}/${year}`;

    const raw = SIGN_KEY + userMa + today;
    return crypto.createHash('sha512').update(raw, 'utf8').digest('hex');
}

/**
 * Format date to HRM API pattern: "yyyy/MM/dd HHmmss"
 */
const formatDateForHrm = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}${minutes}${seconds}`;
};

// Get work shifts for current user
router.get("/ca-lam-viec", [checkJwt], async (req: Request, res: Response) => {
    try {
        const userId = res.locals.jwtPayload.userId;
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOneOrFail({ where: { id: userId } });

        // Prefer x-temp-token from header if provided (useful for previewing shifts before saving)
        const tokenA = (req.headers["x-temp-token"] as string) || user.tokenA;

        if (!tokenA) {
            res.status(400).json({ error: "Token A chưa được cấu hình" });
            return;
        }

        const response = await axios.post(
            `${HRM_BASE_URL}/AttCaLamViec/GetCaLamViecByUser`,
            {},
            {
                headers: {
                    "token": tokenA,
                    "Content-Type": "application/json",
                },
                timeout: 30000,
            }
        );

        // Parse the Data string if it's a string
        if (response.data.Data && typeof response.data.Data === 'string') {
            response.data.Data = JSON.parse(response.data.Data);
        }

        res.json(response.data);
    } catch (error: any) {
        console.error("HRM API error:", error.message);
        res.status(500).json({ error: "Không thể lấy ca làm việc" });
    }
});

// Get account info from HRM
router.get("/account-info", [checkJwt], async (req: Request, res: Response) => {
    try {
        const userId = res.locals.jwtPayload.userId;
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOneOrFail({ where: { id: userId } });

        if (!user.tokenA) {
            res.status(400).json({ error: "Token A chưa được cấu hình" });
            return;
        }

        const response = await axios.post(
            `${HRM_BASE_URL}/user/AccountInfo`,
            {},
            {
                headers: {
                    "token": user.tokenA,
                },
                timeout: 30000,
            }
        );

        // Parse the Data string if it's a string
        if (response.data.Data && typeof response.data.Data === 'string') {
            response.data.Data = JSON.parse(response.data.Data);
        }

        res.json(response.data);
    } catch (error: any) {
        console.error("HRM Account Info error:", error.message);
        res.status(500).json({ error: "Không thể lấy thông tin tài khoản" });
    }
});

// Check-in or Check-out
router.post("/cham-cong", [checkJwt], async (req: Request, res: Response) => {
    try {
        const userId = res.locals.jwtPayload.userId;
        const { maCaLamViec, vao } = req.body;

        if (!maCaLamViec || vao === undefined) {
            res.status(400).json({ error: "Thiếu thông tin mã ca làm việc hoặc loại chấm công" });
            return;
        }

        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOneOrFail({ where: { id: userId } });

        if (!user.tokenA) {
            res.status(400).json({ error: "Token A chưa được cấu hình" });
            return;
        }

        // Get user ma from account info for Sign
        const accountResponse = await axios.post(
            `${HRM_BASE_URL}/user/AccountInfo`,
            {},
            {
                headers: {
                    "token": user.tokenA,
                },
                timeout: 30000,
            }
        );

        let userMa: string | null = null;
        if (accountResponse.data.Status === "OK" && accountResponse.data.Data) {
            const data = typeof accountResponse.data.Data === 'string'
                ? JSON.parse(accountResponse.data.Data)
                : accountResponse.data.Data;
            userMa = data.ma;
        }

        if (!userMa) {
            res.status(400).json({ error: "Không thể lấy mã user để tạo Sign" });
            return;
        }

        const ngayGioCham = formatDateForHrm(new Date());
        const sign = getSign(userMa);

        const response = await axios.post(
            `${HRM_BASE_URL}/ChamCong/AddAPI`,
            null,
            {
                headers: {
                    "token": user.tokenA,
                    "Content-Type": "application/json",
                },
                params: {
                    MaCaLamViec: maCaLamViec,
                    Vao: vao,
                    NgayGioCham: ngayGioCham,
                    Sign: sign,
                },
                timeout: 30000,
            }
        );

        res.json(response.data);
    } catch (error: any) {
        console.error("HRM API error:", error.message);
        res.status(500).json({ error: "Chấm công thất bại" });
    }
});

// Get all auto check-in logs (admin only)
router.get("/logs", [checkJwt, checkRole(["admin"])], async (req: Request, res: Response) => {
    try {
        const logRepo = AppDataSource.getRepository(AutoCheckInLog);
        const limit = parseInt(req.query.limit as string) || 100;

        const logs = await logRepo.find({
            order: { createdAt: "DESC" },
            take: limit,
        });

        res.json(logs);
    } catch (error: any) {
        console.error("Error fetching logs:", error.message);
        res.status(500).json({ error: "Không thể lấy logs" });
    }
});

// Get logs for a specific user
router.get("/logs/:userId", [checkJwt], async (req: Request, res: Response) => {
    try {
        const requestedUserId = parseInt(req.params.userId);
        const currentUserId = res.locals.jwtPayload.userId;
        const currentUserRole = res.locals.jwtPayload.role;

        // Users can only view their own logs unless they are admin
        if (requestedUserId !== currentUserId && currentUserRole !== "admin") {
            res.status(403).json({ error: "Không có quyền xem logs của user khác" });
            return;
        }

        const logRepo = AppDataSource.getRepository(AutoCheckInLog);
        const limit = parseInt(req.query.limit as string) || 50;

        const logs = await logRepo.find({
            where: { userId: requestedUserId },
            order: { createdAt: "DESC" },
            take: limit,
        });

        res.json(logs);
    } catch (error: any) {
        console.error("Error fetching user logs:", error.message);
        res.status(500).json({ error: "Không thể lấy logs" });
    }
});

// Test Discord webhook
router.post("/test-webhook", [checkJwt, checkRole(["admin"])], async (req: Request, res: Response) => {
    try {
        const { sendTestNotification } = await import("../services/discordNotification");
        const success = await sendTestNotification();

        if (success) {
            res.json({ success: true, message: "Test notification sent to Discord!" });
        } else {
            res.status(500).json({ success: false, message: "Failed to send notification" });
        }
    } catch (error: any) {
        console.error("Webhook test error:", error.message);
        res.status(500).json({ error: "Không thể gửi test webhook" });
    }
});

export default router;
