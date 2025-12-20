import axios from "axios";

const DISCORD_WEBHOOK_URL = "https://discordapp.com/api/webhooks/1451782232254451712/OdbtJiMDfDu-TSJ0DOx1-gBJEbsgfEZ5ohSd8p72wNa1dAPhAVV3md5jpptQ0MuQCnXA";

export interface DiscordEmbed {
    title?: string;
    description?: string;
    color?: number;
    fields?: { name: string; value: string; inline?: boolean }[];
    footer?: { text: string };
    timestamp?: string;
}

/**
 * Send a message to Discord via webhook
 */
export async function sendDiscordNotification(
    content?: string,
    embeds?: DiscordEmbed[]
): Promise<boolean> {
    try {
        await axios.post(DISCORD_WEBHOOK_URL, {
            content,
            embeds,
        });
        return true;
    } catch (error: any) {
        console.error("[Discord] Failed to send notification:", error.message);
        return false;
    }
}

/**
 * Send auto check-in log notification
 */
export async function sendAutoCheckInNotification(
    username: string,
    action: "CHECK_IN" | "CHECK_OUT",
    shiftName: string,
    shiftCode: string,
    status: "SUCCESS" | "FAILED",
    scheduledTime: string,
    actualTime: string,
    errorMessage?: string
): Promise<void> {
    const isSuccess = status === "SUCCESS";
    const isCheckIn = action === "CHECK_IN";

    const embed: DiscordEmbed = {
        title: `${isCheckIn ? "🟢 Vào ca" : "🔴 Ra ca"} - ${isSuccess ? "Thành công" : "Thất bại"}`,
        color: isSuccess ? 0x00ff00 : 0xff0000, // Green or Red
        fields: [
            { name: "👤 User", value: username, inline: true },
            { name: "📋 Ca làm việc", value: `${shiftName}`, inline: true },
            { name: "🏷️ Mã ca", value: shiftCode, inline: true },
            { name: "⏰ Giờ theo lịch", value: scheduledTime, inline: true },
            { name: "🕐 Giờ thực hiện", value: actualTime, inline: true },
            { name: "📊 Trạng thái", value: status, inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "TeamHub Auto Check-in" },
    };

    if (!isSuccess && errorMessage) {
        embed.fields?.push({ name: "❌ Lỗi", value: errorMessage, inline: false });
    }

    await sendDiscordNotification(undefined, [embed]);
}

/**
 * Send a test notification
 */
export async function sendTestNotification(): Promise<boolean> {
    const embed: DiscordEmbed = {
        title: "🧪 Test Notification",
        description: "Đây là tin nhắn test từ TeamHub Auto Check-in System",
        color: 0x5865f2, // Discord Blurple
        fields: [
            { name: "🤖 Bot", value: "TeamHub Auto Check-in", inline: true },
            { name: "⏰ Thời gian", value: new Date().toLocaleString("vi-VN"), inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "Webhook hoạt động bình thường!" },
    };

    return await sendDiscordNotification("**🔔 Test Webhook**", [embed]);
}
