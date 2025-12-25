import axios from "axios";
import crypto from "crypto";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { AutoCheckInLog } from "../entities/AutoCheckInLog";
import { sendAutoCheckInNotification, sendDiscordNotification, DiscordEmbed } from "./discordNotification";

const HRM_BASE_URL = "https://hrm.hungduy.vn";
const SIGN_KEY = "OroFGCABgqY2qzvK51fwLfXRSPbjjedP";

// Store daily random offsets for each user (reset each day)
const userOffsets: Map<string, { checkIn: number[], checkOut: number[], date: string }> = new Map();

// Track token errors per shift period to only notify once per shift
// Key: userId_shiftPeriod (e.g., "1_morning", "1_afternoon")
const tokenErrorNotified: Map<string, string> = new Map(); // value is date string

// Cache shift info per user - only fetched when tokenA is updated
interface CachedShift {
    Ma: string;
    Code: string;
    Ten: string;
    fetchedAt: string; // date string for daily refresh
}
const userShiftCache: Map<number, CachedShift> = new Map();

// Cache user "ma" from account info - for generating Sign
const userMaCache: Map<number, string> = new Map();

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
 * Generate random offset between -5 and +5 minutes
 */
function getRandomOffset(): number {
    return Math.floor(Math.random() * 21) - 5; // -5 to +5
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

        // Get user ma for Sign
        const userMa = userMaCache.get(user.id);
        if (!userMa) {
            console.error(`[AutoCheckIn] No user ma cached for ${user.username}, cannot generate Sign`);
            return;
        }
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
                    MaCaLamViec: shiftCode,
                    Vao: vao,
                    NgayGioCham: formatDateForHrm(new Date()),
                    Sign: sign,
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
 * Determine current shift period based on hour
 */
function getCurrentShiftPeriod(): string {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    return "afternoon";
}

/**
 * Send Discord notification for tokenA error (once per shift)
 */
async function notifyTokenError(user: User, errorMessage: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const shiftPeriod = getCurrentShiftPeriod();
    const key = `${user.id}_${shiftPeriod}`;

    // Check if already notified for this shift period today
    const lastNotified = tokenErrorNotified.get(key);
    if (lastNotified === today) {
        console.log(`[AutoCheckIn] Already notified tokenA error for ${user.username} in ${shiftPeriod} shift today`);
        return;
    }

    // Mark as notified
    tokenErrorNotified.set(key, today);

    const embed: DiscordEmbed = {
        title: "⚠️ Lỗi TokenA - Không lấy được ca làm việc",
        color: 0xffa500, // Orange
        fields: [
            { name: "👤 User", value: user.username, inline: true },
            { name: "⏰ Ca", value: shiftPeriod === "morning" ? "Sáng" : "Chiều", inline: true },
            { name: "❌ Lỗi", value: errorMessage, inline: false },
            { name: "💡 Giải pháp", value: "Kiểm tra và cập nhật lại tokenA trong profile", inline: false },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "TeamHub Auto Check-in" },
    };

    await sendDiscordNotification(undefined, [embed]);
    console.log(`[AutoCheckIn] Sent tokenA error notification for ${user.username}`);
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
                // Priority: find shift that user has selected
                if (user.selectedShiftMa) {
                    const selectedShift = data.find((shift: any) => shift.Ma === user.selectedShiftMa);
                    if (selectedShift) {
                        console.log(`[AutoCheckIn] Found user-selected shift for ${user.username}: ${selectedShift.Ten}`);
                        return selectedShift;
                    }
                    console.log(`[AutoCheckIn] User ${user.username} selected shift ${user.selectedShiftMa} not found in today's shifts`);
                }

                // Fallback to first shift
                console.log(`[AutoCheckIn] Using first shift for ${user.username}: ${data[0].Ten}`);
                return data[0];
            } else {
                console.log(`[AutoCheckIn] No shifts found for ${user.username}`);
                // No shift but API returned OK - might be no schedule for today
            }
        } else {
            const errorMsg = response.data.Messenge || response.data.Message || 'API returned error status';
            console.log(`[AutoCheckIn] HRM API error for ${user.username}: ${errorMsg}`);
            // This is likely a tokenA issue - notify Discord
            await notifyTokenError(user, errorMsg);
        }

        return null;
    } catch (error: any) {
        console.error(`[AutoCheckIn] Failed to get shift for ${user.username}:`, error.message);
        // Network or auth error - notify Discord
        await notifyTokenError(user, error.message);
        return null;
    }
}

/**
 * Fetch and cache work shift for a user (call when tokenA is updated)
 * Also fetches account info to get user "ma" for generating Sign
 */
export async function fetchAndCacheUserShift(user: User): Promise<void> {
    console.log(`[AutoCheckIn] Fetching shift and account info for ${user.username}...`);

    // Fetch shift
    const shift = await getUserWorkShift(user);
    if (shift) {
        userShiftCache.set(user.id, {
            ...shift,
            fetchedAt: new Date().toISOString().split('T')[0]
        });
        console.log(`[AutoCheckIn] Cached shift for ${user.username}: ${shift.Ten}`);
    } else {
        userShiftCache.delete(user.id);
        console.log(`[AutoCheckIn] No shift cached for ${user.username}`);
    }

    // Fetch account info to get user "ma" for Sign
    try {
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

        if (response.data.Status === "OK" && response.data.Data) {
            const data = typeof response.data.Data === 'string'
                ? JSON.parse(response.data.Data)
                : response.data.Data;

            if (data.ma) {
                userMaCache.set(user.id, data.ma);
                console.log(`[AutoCheckIn] Cached user ma for ${user.username}: ${data.ma}`);
            }
        }
    } catch (error: any) {
        console.error(`[AutoCheckIn] Failed to get account info for ${user.username}:`, error.message);
    }
}

/**
 * Get cached shift for a user
 */
function getCachedShift(userId: number): CachedShift | null {
    const cached = userShiftCache.get(userId);
    if (!cached) return null;

    // Check if cache is still valid (same day)
    const today = new Date().toISOString().split('T')[0];
    if (cached.fetchedAt !== today) {
        // Cache is stale, should be refreshed when tokenA is updated
        // For now, still use it but log a warning
        console.log(`[AutoCheckIn] Shift cache for user ${userId} is from ${cached.fetchedAt}, using anyway`);
    }
    return cached;
}

/**
 * Main scheduler function - runs every minute
 */
async function runScheduler(): Promise<void> {
    try {
        // Skip Sundays (Chủ nhật) - getDay() returns 0 for Sunday
        const now = new Date();
        if (now.getDay() === 0) {
            return;
        }

        const userRepo = AppDataSource.getRepository(User);

        // Get all users with tokenA
        const users = await userRepo
            .createQueryBuilder("user")
            .where("user.tokenA IS NOT NULL")
            .andWhere("user.tokenA != ''")
            .getMany();

        if (users.length === 0) return;

        const currentTime = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

        for (const user of users) {
            // Get user's work shift from cache (fetched when tokenA is updated)
            const shift = getCachedShift(user.id);
            if (!shift) {
                // No shift cached - will be fetched when user updates tokenA
                continue;
            }

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
 * Fetch shifts for all users with tokenA (called on startup)
 */
async function fetchAllUserShifts(): Promise<void> {
    const userRepo = AppDataSource.getRepository(User);
    const users = await userRepo
        .createQueryBuilder("user")
        .where("user.tokenA IS NOT NULL")
        .andWhere("user.tokenA != ''")
        .getMany();

    console.log(`[AutoCheckIn] Fetching shifts for ${users.length} users with tokenA...`);

    for (const user of users) {
        await fetchAndCacheUserShift(user);
    }

    console.log(`[AutoCheckIn] Finished fetching shifts, cached ${userShiftCache.size} shifts`);
}

/**
 * Start the auto check-in scheduler
 */
export function startAutoCheckInScheduler(): void {
    console.log("[AutoCheckIn] Starting scheduler...");

    // Fetch all user shifts on startup
    fetchAllUserShifts().catch(err => {
        console.error("[AutoCheckIn] Error fetching initial shifts:", err);
    });

    // Run every minute
    schedulerInterval = setInterval(runScheduler, 60 * 1000);

    // Also run immediately on startup (will use cache after fetchAllUserShifts completes)
    setTimeout(() => runScheduler(), 5000); // Wait 5s for initial fetch to complete

    console.log("[AutoCheckIn] Scheduler started - checking every minute (shift fetch only on tokenA update)");
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
