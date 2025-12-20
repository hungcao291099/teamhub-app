import axios from "axios";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { AutoCheckInLog } from "../entities/AutoCheckInLog";
import { sendAutoCheckInNotification } from "./discordNotification";

const HRM_BASE_URL = "https://hrm.hungduy.vn";

// Store daily random offsets for each user (reset each day)
const userOffsets: Map<string, { checkIn: number[], checkOut: number[], date: string }> = new Map();

/**
 * Parse time from shift name
 * Example: "Hành chánh 1 (7h30-11h30, 13h-17h)" -> [[7,30], [11,30], [13,0], [17,0]]
 */
function parseShiftTimes(shiftName: string): { hour: number, minute: number }[] {
    const times: { hour: number, minute: number }[] = [];
    // Match patterns like "7h30", "7h", "13h00"
    const regex = /(\d+)h(\d+)?/g;
    let match;

    while ((match = regex.exec(shiftName)) !== null) {
        const hour = parseInt(match[1], 10);
        const minute = match[2] ? parseInt(match[2], 10) : 0;
        times.push({ hour, minute });
    }

    return times;
}

/**
 * Get check-in and check-out times from parsed times
 * Assumes pairs: [checkIn, checkOut, checkIn, checkOut, ...]
 */
function getCheckInOutTimes(times: { hour: number, minute: number }[]): {
    checkInTimes: { hour: number, minute: number }[],
    checkOutTimes: { hour: number, minute: number }[]
} {
    const checkInTimes: { hour: number, minute: number }[] = [];
    const checkOutTimes: { hour: number, minute: number }[] = [];

    for (let i = 0; i < times.length; i += 2) {
        if (times[i]) checkInTimes.push(times[i]);
        if (times[i + 1]) checkOutTimes.push(times[i + 1]);
    }

    return { checkInTimes, checkOutTimes };
}

/**
 * Generate random offset between -10 and +10 minutes
 */
function getRandomOffset(): number {
    return Math.floor(Math.random() * 21) - 10; // -10 to +10
}

/**
 * Get or create daily offsets for a user
 */
function getUserDailyOffsets(userId: number, checkInCount: number, checkOutCount: number): {
    checkIn: number[],
    checkOut: number[]
} {
    const today = new Date().toISOString().split('T')[0];
    const key = `${userId}`;
    const existing = userOffsets.get(key);

    if (existing && existing.date === today) {
        return { checkIn: existing.checkIn, checkOut: existing.checkOut };
    }

    // Generate new offsets for today
    const checkInOffsets = Array.from({ length: checkInCount }, () => getRandomOffset());
    const checkOutOffsets = Array.from({ length: checkOutCount }, () => getRandomOffset());

    userOffsets.set(key, { checkIn: checkInOffsets, checkOut: checkOutOffsets, date: today });

    return { checkIn: checkInOffsets, checkOut: checkOutOffsets };
}

/**
 * Format date for HRM API: "yyyy/MM/dd HHmmss"
 */
function formatDateForHrm(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}${minutes}${seconds}`;
}

/**
 * Check if current time matches target time with offset (within 1 minute window)
 */
function isTimeToExecute(
    targetHour: number,
    targetMinute: number,
    offsetMinutes: number
): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Calculate target time with offset
    let adjustedMinute = targetMinute + offsetMinutes;
    let adjustedHour = targetHour;

    if (adjustedMinute < 0) {
        adjustedMinute += 60;
        adjustedHour -= 1;
    } else if (adjustedMinute >= 60) {
        adjustedMinute -= 60;
        adjustedHour += 1;
    }

    return currentHour === adjustedHour && currentMinute === adjustedMinute;
}

/**
 * Execute check-in or check-out for a user
 */
async function executeCheckInOut(
    user: User,
    shiftCode: string,
    shiftName: string,
    action: "CHECK_IN" | "CHECK_OUT",
    scheduledTime: string,
    actualTime: string
): Promise<void> {
    const logRepo = AppDataSource.getRepository(AutoCheckInLog);

    try {
        const vao = action === "CHECK_IN" ? "1" : "0";

        const response = await axios.post(
            `${HRM_BASE_URL}/ChamCong/AddAPI`,
            null,
            {
                headers: {
                    "token": user.tokenA,
                    "Content-Type": "application/json",
                },
                params: {
                    MaCaLamViec: shiftCode,
                    Vao: vao,
                    NgayGioCham: formatDateForHrm(new Date()),
                },
                timeout: 30000,
            }
        );

        const status = response.data.Status === "OK" ? "SUCCESS" : "FAILED";

        // Save success log
        const log = new AutoCheckInLog();
        log.userId = user.id;
        log.username = user.username;
        log.action = action;
        log.shiftCode = shiftCode;
        log.shiftName = shiftName;
        log.scheduledTime = scheduledTime;
        log.actualTime = actualTime;
        log.status = status;
        log.response = JSON.stringify(response.data);

        await logRepo.save(log);

        // Send Discord notification
        await sendAutoCheckInNotification(
            user.username,
            action,
            shiftName,
            shiftCode,
            status as "SUCCESS" | "FAILED",
            scheduledTime,
            actualTime
        );

        console.log(`[AutoCheckIn] ${action} for ${user.username} - ${log.status}`);

    } catch (error: any) {
        // Save error log
        const log = new AutoCheckInLog();
        log.userId = user.id;
        log.username = user.username;
        log.action = action;
        log.shiftCode = shiftCode;
        log.shiftName = shiftName;
        log.scheduledTime = scheduledTime;
        log.actualTime = actualTime;
        log.status = "FAILED";
        log.response = JSON.stringify({ error: error.message });

        await logRepo.save(log);

        // Send Discord notification for failure
        await sendAutoCheckInNotification(
            user.username,
            action,
            shiftName,
            shiftCode,
            "FAILED",
            scheduledTime,
            actualTime,
            error.message
        );

        console.error(`[AutoCheckIn] ${action} FAILED for ${user.username}:`, error.message);
    }
}

/**
 * Get work shift for a user from HRM API
 */
async function getUserWorkShift(user: User): Promise<{ Ma: string, Code: string, Ten: string } | null> {
    try {
        const response = await axios.post(
            `${HRM_BASE_URL}/AttCaLamViec/GetCaLamViecByUser`,
            {},
            {
                headers: {
                    "token": user.tokenA,
                    "Content-Type": "application/json",
                },
                timeout: 30000,
            }
        );

        console.log(`[AutoCheckIn] HRM response for ${user.username}:`, JSON.stringify(response.data));

        if (response.data.Status === "OK" && response.data.Data) {
            const data = typeof response.data.Data === 'string'
                ? JSON.parse(response.data.Data)
                : response.data.Data;

            if (data.length > 0) {
                console.log(`[AutoCheckIn] Found shift for ${user.username}: ${data[0].Ten}`);
                return data[0];
            } else {
                console.log(`[AutoCheckIn] No shifts found for ${user.username}`);
            }
        } else {
            console.log(`[AutoCheckIn] HRM API error for ${user.username}: ${response.data.Messenge || 'Unknown error'}`);
        }

        return null;
    } catch (error: any) {
        console.error(`[AutoCheckIn] Failed to get shift for ${user.username}:`, error.message);
        return null;
    }
}

/**
 * Main scheduler function - runs every minute
 */
async function runScheduler(): Promise<void> {
    try {
        const userRepo = AppDataSource.getRepository(User);

        // Get all users with tokenA
        const users = await userRepo
            .createQueryBuilder("user")
            .where("user.tokenA IS NOT NULL")
            .andWhere("user.tokenA != ''")
            .getMany();

        if (users.length === 0) return;

        const now = new Date();
        const currentTime = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

        for (const user of users) {
            // Get user's work shift
            const shift = await getUserWorkShift(user);
            if (!shift) continue;

            // Parse times from shift name
            const times = parseShiftTimes(shift.Ten);
            if (times.length === 0) continue;

            const { checkInTimes, checkOutTimes } = getCheckInOutTimes(times);
            const offsets = getUserDailyOffsets(user.id, checkInTimes.length, checkOutTimes.length);

            // Check for check-in times
            for (let i = 0; i < checkInTimes.length; i++) {
                const t = checkInTimes[i];
                const offset = offsets.checkIn[i] || 0;

                if (isTimeToExecute(t.hour, t.minute, offset)) {
                    const scheduledTime = `${t.hour}:${String(t.minute).padStart(2, '0')}`;
                    await executeCheckInOut(user, shift.Ma, shift.Ten, "CHECK_IN", scheduledTime, currentTime);
                }
            }

            // Check for check-out times
            for (let i = 0; i < checkOutTimes.length; i++) {
                const t = checkOutTimes[i];
                const offset = offsets.checkOut[i] || 0;

                if (isTimeToExecute(t.hour, t.minute, offset)) {
                    const scheduledTime = `${t.hour}:${String(t.minute).padStart(2, '0')}`;
                    await executeCheckInOut(user, shift.Ma, shift.Ten, "CHECK_OUT", scheduledTime, currentTime);
                }
            }
        }
    } catch (error) {
        console.error("[AutoCheckIn] Scheduler error:", error);
    }
}

let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Start the auto check-in scheduler
 */
export function startAutoCheckInScheduler(): void {
    console.log("[AutoCheckIn] Starting scheduler...");

    // Run every minute
    schedulerInterval = setInterval(runScheduler, 60 * 1000);

    // Also run immediately on startup
    runScheduler();

    console.log("[AutoCheckIn] Scheduler started - checking every minute");
}

/**
 * Stop the scheduler
 */
export function stopAutoCheckInScheduler(): void {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        console.log("[AutoCheckIn] Scheduler stopped");
    }
}
