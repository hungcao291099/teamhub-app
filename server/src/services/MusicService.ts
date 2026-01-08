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

export interface AddedByInfo {
    userId: number;
    username: string;
}

export interface MusicInfo {
    url: string;           // Original URL
    audioUrl: string;      // Direct audio stream URL
    title: string;
    duration: number;      // Duration in seconds
    thumbnail: string;
    platform: "youtube" | "soundcloud" | "direct";
    artist?: string;
    addedBy?: AddedByInfo; // Who added this song
}

export type LoopMode = "off" | "one" | "all";

export interface MusicState {
    currentMusic: MusicInfo | null;
    isPlaying: boolean;
    startedAt: number | null;  // Timestamp when playback started (for sync)
    pausedAt: number | null;   // Position when paused (in seconds)
    // Queue management
    queue: MusicInfo[];
    currentIndex: number;
    loopMode: LoopMode;
    shuffleEnabled: boolean;
    shuffleOrder: number[];    // Shuffled indices for playback
}

export type VoteActionType = 'skip' | 'previous' | 'pause' | 'stop' | 'delete';

export interface VoteState {
    actionType: VoteActionType;
    songTitle: string;
    initiatorId: number;
    initiatorName: string;
    targetIndex?: number; // for delete action
    votes: number[]; // user IDs who voted yes
    requiredVotes: number;
    startedAt: number;
    expiresAt: number; // Auto-expire after 30 seconds
}

// In-memory music state (shared across all clients)
let musicState: MusicState = {
    currentMusic: null,
    isPlaying: false,
    startedAt: null,
    pausedAt: null,
    queue: [],
    currentIndex: -1,
    loopMode: "off",
    shuffleEnabled: false,
    shuffleOrder: []
};

// Voting state
let voteState: VoteState | null = null;

// Callback for socket broadcast (set from routes)
let onStateChange: ((state: MusicState) => void) | null = null;
let onVoteChange: ((vote: VoteState | null, result?: 'passed' | 'failed' | 'cancelled' | 'expired') => void) | null = null;

export function setOnStateChange(callback: (state: MusicState) => void) {
    onStateChange = callback;
}

export function setOnVoteChange(callback: (vote: VoteState | null, result?: 'passed' | 'failed' | 'cancelled' | 'expired') => void) {
    onVoteChange = callback;
}

function broadcastState() {
    if (onStateChange) {
        onStateChange(getMusicState());
    }
}

function broadcastVote(result?: 'passed' | 'failed' | 'cancelled' | 'expired') {
    if (onVoteChange) {
        onVoteChange(voteState, result);
    }
}

// ==================== VOTING FUNCTIONS ====================

/**
 * Check if user owns the current song
 */
export function isOwner(userId: number): boolean {
    return musicState.currentMusic?.addedBy?.userId === userId;
}

/**
 * Get current vote state
 */
export function getVoteState(): VoteState | null {
    return voteState ? { ...voteState, votes: [...voteState.votes] } : null;
}

/**
 * Start a vote for an action
 */
export function startVote(
    actionType: VoteActionType,
    userId: number,
    username: string,
    onlineCount: number,
    targetIndex?: number
): VoteState | null {
    // Can't start vote if one is already active
    if (voteState) {
        return null;
    }

    // Calculate required votes (>= 50% of online users)
    const requiredVotes = Math.max(1, Math.ceil(onlineCount / 2));

    const newVote: VoteState = {
        actionType,
        songTitle: musicState.currentMusic?.title || "Unknown",
        initiatorId: userId,
        initiatorName: username,
        targetIndex,
        votes: [userId], // Initiator automatically votes yes
        requiredVotes,
        startedAt: Date.now(),
        expiresAt: Date.now() + 30000 // 30 seconds
    };

    // Check if requirement is met immediately (e.g. online count is 1 or 2)
    if (newVote.votes.length >= newVote.requiredVotes) {
        voteState = newVote; // Set temporarily for execution
        executeVoteAction();
        voteState = null;
        if (onVoteChange) {
            onVoteChange(newVote, 'passed');
        }
        return newVote;
    }

    voteState = newVote;
    broadcastVote();

    // Set auto-expire timer
    setTimeout(() => {
        if (voteState && voteState.startedAt === newVote.startedAt) {
            clearExpiredVote();
        }
    }, 30000);

    return voteState;
}

/**
 * Submit a vote
 */
export function submitVote(userId: number): VoteState | null {
    if (!voteState) return null;

    // Already voted
    if (voteState.votes.includes(userId)) {
        return voteState;
    }

    voteState.votes.push(userId);

    // Check if vote passed
    if (voteState.votes.length >= voteState.requiredVotes) {
        executeVoteAction();
        const finalVote = { ...voteState, votes: [...voteState.votes] };
        voteState = null;
        // Broadcast vote end with the saved final vote
        if (onVoteChange) {
            onVoteChange(finalVote, 'passed');
        }
        return finalVote;
    }

    // Vote not yet passed, broadcast updated state
    broadcastVote();
    return voteState;
}

/**
 * Cancel a vote (only initiator can cancel)
 */
export function cancelVote(userId: number): boolean {
    if (!voteState) return false;
    if (voteState.initiatorId !== userId) return false;

    voteState = null;
    broadcastVote('cancelled');
    return true;
}

/**
 * Clear expired vote
 */
function clearExpiredVote() {
    if (voteState && Date.now() >= voteState.expiresAt) {
        voteState = null;
        broadcastVote('expired');
    }
}

/**
 * Execute the action when vote passes
 */
function executeVoteAction() {
    if (!voteState) return;

    switch (voteState.actionType) {
        case 'skip':
            playNext();
            break;
        case 'previous':
            playPrevious();
            break;
        case 'pause':
            pauseMusic();
            break;
        case 'stop':
            stopMusic();
            break;
        case 'delete':
            if (voteState.targetIndex !== undefined) {
                removeFromQueue(voteState.targetIndex);
            }
            break;
    }

    broadcastState();
}

/**
 * Generate shuffled order for queue
 */
function generateShuffleOrder(queueLength: number, currentIndex: number): number[] {
    const indices = Array.from({ length: queueLength }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    // Move current index to front if it exists
    if (currentIndex >= 0 && currentIndex < queueLength) {
        const pos = indices.indexOf(currentIndex);
        if (pos > 0) {
            indices.splice(pos, 1);
            indices.unshift(currentIndex);
        }
    }
    return indices;
}

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
    return { ...musicState, queue: [...musicState.queue] };
}

/**
 * Update audio URL for current song (when URL expires)
 */
export function updateCurrentAudioUrl(newAudioUrl: string): MusicState {
    if (musicState.currentMusic && musicState.currentIndex >= 0) {
        musicState.currentMusic.audioUrl = newAudioUrl;
        // Also update in queue
        if (musicState.currentIndex < musicState.queue.length) {
            musicState.queue[musicState.currentIndex].audioUrl = newAudioUrl;
        }
    }
    return musicState;
}

/**
 * Set new music (replaces current and clears queue)
 */
export function setMusic(music: MusicInfo): MusicState {
    musicState = {
        currentMusic: music,
        isPlaying: true,
        startedAt: Date.now(),
        pausedAt: null,
        queue: [music],
        currentIndex: 0,
        loopMode: musicState.loopMode,
        shuffleEnabled: musicState.shuffleEnabled,
        shuffleOrder: [0]
    };
    return musicState;
}

/**
 * Add music to queue
 */
export function addToQueue(music: MusicInfo): MusicState {
    musicState.queue.push(music);

    // Update shuffle order
    if (musicState.shuffleEnabled) {
        musicState.shuffleOrder = generateShuffleOrder(musicState.queue.length, musicState.currentIndex);
    }

    // If no music playing, start playing
    if (!musicState.currentMusic) {
        playAtIndex(musicState.queue.length - 1);
    }

    return musicState;
}

/**
 * Add music to queue and play immediately
 */
export function addAndPlay(music: MusicInfo): MusicState {
    musicState.queue.push(music);
    const newIndex = musicState.queue.length - 1;

    if (musicState.shuffleEnabled) {
        musicState.shuffleOrder = generateShuffleOrder(musicState.queue.length, newIndex);
    }

    playAtIndex(newIndex);
    return musicState;
}

/**
 * Play music at specific index
 */
export function playAtIndex(index: number): MusicState {
    if (index >= 0 && index < musicState.queue.length) {
        musicState.currentMusic = musicState.queue[index];
        musicState.currentIndex = index;
        musicState.isPlaying = true;
        musicState.startedAt = Date.now();
        musicState.pausedAt = null;
    }
    return musicState;
}

/**
 * Remove from queue
 */
export function removeFromQueue(index: number): MusicState {
    if (index < 0 || index >= musicState.queue.length) {
        return musicState;
    }

    musicState.queue.splice(index, 1);

    // Adjust currentIndex
    if (musicState.queue.length === 0) {
        musicState.currentMusic = null;
        musicState.currentIndex = -1;
        musicState.isPlaying = false;
        musicState.startedAt = null;
        musicState.pausedAt = null;
    } else if (index < musicState.currentIndex) {
        musicState.currentIndex--;
    } else if (index === musicState.currentIndex) {
        // Current song was removed, play next or previous
        const newIndex = Math.min(musicState.currentIndex, musicState.queue.length - 1);
        playAtIndex(newIndex);
    }

    // Update shuffle order
    if (musicState.shuffleEnabled) {
        musicState.shuffleOrder = generateShuffleOrder(musicState.queue.length, musicState.currentIndex);
    }

    return musicState;
}

/**
 * Move item in queue
 */
export function moveInQueue(fromIndex: number, toIndex: number): MusicState {
    if (fromIndex < 0 || fromIndex >= musicState.queue.length ||
        toIndex < 0 || toIndex >= musicState.queue.length) {
        return musicState;
    }

    const [item] = musicState.queue.splice(fromIndex, 1);
    musicState.queue.splice(toIndex, 0, item);

    // Adjust currentIndex
    if (fromIndex === musicState.currentIndex) {
        musicState.currentIndex = toIndex;
    } else if (fromIndex < musicState.currentIndex && toIndex >= musicState.currentIndex) {
        musicState.currentIndex--;
    } else if (fromIndex > musicState.currentIndex && toIndex <= musicState.currentIndex) {
        musicState.currentIndex++;
    }

    return musicState;
}

/**
 * Move item to top of queue (after current)
 */
export function moveToTop(index: number): MusicState {
    if (index <= musicState.currentIndex || index >= musicState.queue.length) {
        return musicState;
    }

    // Move to position right after current
    const targetIndex = musicState.currentIndex + 1;
    return moveInQueue(index, targetIndex);
}

/**
 * Clear queue (keep current playing)
 */
export function clearQueue(): MusicState {
    if (musicState.currentMusic && musicState.currentIndex >= 0) {
        // Keep only current song
        musicState.queue = [musicState.currentMusic];
        musicState.currentIndex = 0;
        musicState.shuffleOrder = [0];
    } else {
        musicState.queue = [];
        musicState.currentIndex = -1;
        musicState.shuffleOrder = [];
    }
    return musicState;
}

/**
 * Get next index based on shuffle and loop modes
 */
function getNextIndex(): number {
    if (musicState.queue.length === 0) return -1;

    if (musicState.loopMode === "one") {
        return musicState.currentIndex;
    }

    let nextIndex: number;

    if (musicState.shuffleEnabled) {
        // Find current position in shuffle order
        const shufflePos = musicState.shuffleOrder.indexOf(musicState.currentIndex);
        const nextShufflePos = shufflePos + 1;

        if (nextShufflePos >= musicState.shuffleOrder.length) {
            // End of shuffle order
            if (musicState.loopMode === "all") {
                // Regenerate shuffle and start from beginning
                musicState.shuffleOrder = generateShuffleOrder(musicState.queue.length, -1);
                nextIndex = musicState.shuffleOrder[0];
            } else {
                return -1; // End of queue
            }
        } else {
            nextIndex = musicState.shuffleOrder[nextShufflePos];
        }
    } else {
        nextIndex = musicState.currentIndex + 1;

        if (nextIndex >= musicState.queue.length) {
            if (musicState.loopMode === "all") {
                nextIndex = 0;
            } else {
                return -1; // End of queue
            }
        }
    }

    return nextIndex;
}

/**
 * Get previous index
 */
function getPreviousIndex(): number {
    if (musicState.queue.length === 0) return -1;

    if (musicState.shuffleEnabled) {
        const shufflePos = musicState.shuffleOrder.indexOf(musicState.currentIndex);
        if (shufflePos <= 0) {
            if (musicState.loopMode === "all") {
                return musicState.shuffleOrder[musicState.shuffleOrder.length - 1];
            }
            return musicState.currentIndex; // Stay at current
        }
        return musicState.shuffleOrder[shufflePos - 1];
    } else {
        if (musicState.currentIndex <= 0) {
            if (musicState.loopMode === "all") {
                return musicState.queue.length - 1;
            }
            return 0; // Stay at first
        }
        return musicState.currentIndex - 1;
    }
}

/**
 * Play next track
 */
export function playNext(): MusicState {
    const nextIndex = getNextIndex();

    if (nextIndex >= 0) {
        playAtIndex(nextIndex);
    } else {
        // End of queue
        musicState.isPlaying = false;
        musicState.pausedAt = 0;
        musicState.startedAt = null;
    }

    return musicState;
}

/**
 * Play previous track
 */
export function playPrevious(): MusicState {
    // If more than 3 seconds into song, restart current song
    if (musicState.startedAt && musicState.isPlaying) {
        const currentPos = (Date.now() - musicState.startedAt) / 1000;
        if (currentPos > 3) {
            musicState.startedAt = Date.now();
            musicState.pausedAt = null;
            return musicState;
        }
    }

    const prevIndex = getPreviousIndex();
    playAtIndex(prevIndex);
    return musicState;
}

/**
 * Set loop mode
 */
export function setLoopMode(mode: LoopMode): MusicState {
    musicState.loopMode = mode;
    return musicState;
}

/**
 * Toggle shuffle
 */
export function toggleShuffle(): MusicState {
    musicState.shuffleEnabled = !musicState.shuffleEnabled;

    if (musicState.shuffleEnabled) {
        musicState.shuffleOrder = generateShuffleOrder(musicState.queue.length, musicState.currentIndex);
    } else {
        musicState.shuffleOrder = Array.from({ length: musicState.queue.length }, (_, i) => i);
    }

    return musicState;
}

/**
 * Called when a song ends - handles auto-play next
 */
export function onSongEnd(): MusicState {
    return playNext();
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
        pausedAt: null,
        queue: [],
        currentIndex: -1,
        loopMode: musicState.loopMode,
        shuffleEnabled: musicState.shuffleEnabled,
        shuffleOrder: []
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
