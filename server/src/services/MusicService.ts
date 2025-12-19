import { exec } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import path from "path";

const execAsync = promisify(exec);

// Try to find yt-dlp executable
function getYtDlpPath(): string {
    // Common Windows locations
    const possiblePaths = [
        "yt-dlp", // In PATH
        path.join(process.env.LOCALAPPDATA || "", "Microsoft", "WinGet", "Packages", "yt-dlp.yt-dlp_Microsoft.Winget.Source_8wekyb3d8bbwe", "yt-dlp.exe"),
        path.join(process.env.USERPROFILE || "", "AppData", "Local", "Microsoft", "WinGet", "Links", "yt-dlp.exe"),
        "C:\\yt-dlp\\yt-dlp.exe",
        path.join(process.env.USERPROFILE || "", "scoop", "apps", "yt-dlp", "current", "yt-dlp.exe"),
    ];

    for (const p of possiblePaths) {
        if (p === "yt-dlp") continue; // Skip checking PATH entry
        if (existsSync(p)) {
            console.log(`Found yt-dlp at: ${p}`);
            return `"${p}"`; // Quote for spaces in path
        }
    }

    // Default to just "yt-dlp" and hope it's in PATH
    return "yt-dlp";
}

const YTDLP = getYtDlpPath();

export interface MusicInfo {
    url: string;           // Original URL
    audioUrl: string;      // Direct audio stream URL
    title: string;
    duration: number;      // Duration in seconds
    thumbnail: string;
    platform: "youtube" | "soundcloud" | "direct";
    artist?: string;
}

export interface MusicState {
    currentMusic: MusicInfo | null;
    isPlaying: boolean;
    startedAt: number | null;  // Timestamp when playback started (for sync)
    pausedAt: number | null;   // Position when paused (in seconds)
}

// In-memory music state (shared across all clients)
let musicState: MusicState = {
    currentMusic: null,
    isPlaying: false,
    startedAt: null,
    pausedAt: null
};

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): "youtube" | "soundcloud" | "direct" {
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        return "youtube";
    }
    if (url.includes("soundcloud.com")) {
        return "soundcloud";
    }
    return "direct";
}

/**
 * Extract audio info using yt-dlp
 */
export async function extractAudioInfo(url: string): Promise<MusicInfo> {
    const platform = detectPlatform(url);

    // For direct audio URLs, skip extraction
    if (platform === "direct") {
        return {
            url,
            audioUrl: url,
            title: "Direct Audio",
            duration: 0,
            thumbnail: "",
            platform: "direct"
        };
    }

    try {
        // Use yt-dlp to extract audio info
        // Format: best audio only, output as JSON
        const command = `${YTDLP} -f "bestaudio" --get-url --get-title --get-duration --get-thumbnail -j "${url}"`;


        const { stdout } = await execAsync(command, { timeout: 30000 });
        const lines = stdout.trim().split("\n");

        // Parse JSON output from yt-dlp
        let info: any = {};
        for (const line of lines) {
            try {
                info = JSON.parse(line);
                break;
            } catch {
                continue;
            }
        }

        // Find best audio format URL
        let audioUrl = "";
        if (info.formats) {
            // Get best audio-only format
            const audioFormats = info.formats.filter((f: any) =>
                f.acodec !== "none" && (f.vcodec === "none" || !f.vcodec)
            );
            if (audioFormats.length > 0) {
                // Sort by audio quality
                audioFormats.sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0));
                audioUrl = audioFormats[0].url;
            }
        }

        // Fallback: use requested formats
        if (!audioUrl && info.url) {
            audioUrl = info.url;
        }

        // Another fallback: run simpler command
        if (!audioUrl) {
            const simpleCmd = `${YTDLP} -f "bestaudio" --get-url "${url}"`;
            const { stdout: urlOut } = await execAsync(simpleCmd, { timeout: 30000 });
            audioUrl = urlOut.trim().split("\n")[0];
        }

        return {
            url,
            audioUrl,
            title: info.title || "Unknown Title",
            duration: info.duration || 0,
            thumbnail: info.thumbnail || "",
            platform,
            artist: info.channel || info.uploader || undefined
        };
    } catch (error: any) {
        console.error("yt-dlp extraction error:", error.message);
        throw new Error(`Failed to extract audio: ${error.message}`);
    }
}

/**
 * Get current music state
 */
export function getMusicState(): MusicState {
    return { ...musicState };
}

/**
 * Set new music
 */
export function setMusic(music: MusicInfo): MusicState {
    musicState = {
        currentMusic: music,
        isPlaying: true,
        startedAt: Date.now(),
        pausedAt: null
    };
    return musicState;
}

/**
 * Play music (resume)
 */
export function playMusic(): MusicState {
    if (musicState.currentMusic) {
        musicState.isPlaying = true;
        // Calculate new startedAt based on where we paused
        if (musicState.pausedAt !== null) {
            musicState.startedAt = Date.now() - (musicState.pausedAt * 1000);
        } else {
            musicState.startedAt = Date.now();
        }
        musicState.pausedAt = null;
    }
    return musicState;
}

/**
 * Pause music
 */
export function pauseMusic(): MusicState {
    if (musicState.currentMusic && musicState.isPlaying && musicState.startedAt) {
        musicState.isPlaying = false;
        // Calculate current position in seconds
        musicState.pausedAt = (Date.now() - musicState.startedAt) / 1000;
    }
    return musicState;
}

/**
 * Stop music
 */
export function stopMusic(): MusicState {
    musicState = {
        currentMusic: null,
        isPlaying: false,
        startedAt: null,
        pausedAt: null
    };
    return musicState;
}

/**
 * Seek to position
 */
export function seekMusic(position: number): MusicState {
    if (musicState.currentMusic) {
        if (musicState.isPlaying) {
            musicState.startedAt = Date.now() - (position * 1000);
        } else {
            musicState.pausedAt = position;
        }
    }
    return musicState;
}
