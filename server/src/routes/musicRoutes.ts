import { Router, Request, Response } from "express";
import {
    extractAudioInfo,
    getMusicState,
    setMusic,
    playMusic,
    pauseMusic,
    stopMusic,
    seekMusic,
    detectPlatform,
    addToQueue,
    addAndPlay,
    removeFromQueue,
    moveInQueue,
    moveToTop,
    clearQueue,
    playNext,
    playPrevious,
    setLoopMode,
    toggleShuffle,
    playAtIndex,
    onSongEnd,
    LoopMode
} from "../services/MusicService";
import { getIO } from "../socket";

const router = Router();

// Helper to broadcast state to all clients
function broadcastState() {
    const io = getIO();
    const state = getMusicState();
    io.emit("music:state", state);
}

/**
 * POST /music/set
 * Set music from URL (replaces current and clears queue)
 */
router.post("/set", async (req: Request, res: Response) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }

        console.log(`Extracting audio from: ${url}`);

        const musicInfo = await extractAudioInfo(url);
        const state = setMusic(musicInfo);

        broadcastState();
        res.json({ success: true, state });
    } catch (error: any) {
        console.error("Error setting music:", error);
        res.status(500).json({ error: error.message || "Failed to set music" });
    }
});

/**
 * GET /music/current
 * Get current music state
 */
router.get("/current", (req: Request, res: Response) => {
    const state = getMusicState();
    res.json(state);
});

/**
 * POST /music/play
 * Resume playback
 */
router.post("/play", (req: Request, res: Response) => {
    playMusic();
    broadcastState();
    res.json({ success: true, state: getMusicState() });
});

/**
 * POST /music/pause
 * Pause playback
 */
router.post("/pause", (req: Request, res: Response) => {
    pauseMusic();
    broadcastState();
    res.json({ success: true, state: getMusicState() });
});

/**
 * POST /music/stop
 * Stop playback and clear queue
 */
router.post("/stop", (req: Request, res: Response) => {
    stopMusic();
    broadcastState();
    res.json({ success: true, state: getMusicState() });
});

/**
 * POST /music/seek
 * Seek to position
 */
router.post("/seek", (req: Request, res: Response) => {
    const { position } = req.body;

    if (typeof position !== "number") {
        return res.status(400).json({ error: "Position is required" });
    }

    seekMusic(position);
    broadcastState();
    res.json({ success: true, state: getMusicState() });
});

/**
 * POST /music/preview
 * Preview music info without setting it
 */
router.post("/preview", async (req: Request, res: Response) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }

        const musicInfo = await extractAudioInfo(url);
        res.json({ success: true, info: musicInfo });
    } catch (error: any) {
        console.error("Error previewing music:", error);
        res.status(500).json({ error: error.message || "Failed to preview music" });
    }
});

/**
 * POST /music/queue/add
 * Add music to queue
 */
router.post("/queue/add", async (req: Request, res: Response) => {
    try {
        const { url, userId, username } = req.body;

        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }

        const musicInfo = await extractAudioInfo(url);

        // Attach user info if provided
        if (userId && username) {
            musicInfo.addedBy = { userId, username };
        }

        addToQueue(musicInfo);

        // Broadcast state update
        broadcastState();

        // Broadcast toast notification to all clients
        const io = getIO();
        io.emit("music:queue_added", {
            title: musicInfo.title,
            addedBy: username || "Someone",
            thumbnail: musicInfo.thumbnail
        });

        res.json({ success: true, state: getMusicState(), addedMusic: musicInfo });
    } catch (error: any) {
        console.error("Error adding to queue:", error);
        res.status(500).json({ error: error.message || "Failed to add to queue" });
    }
});

/**
 * POST /music/queue/add-and-play
 * Add music to queue and play immediately
 */
router.post("/queue/add-and-play", async (req: Request, res: Response) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }

        const musicInfo = await extractAudioInfo(url);
        addAndPlay(musicInfo);

        broadcastState();
        res.json({ success: true, state: getMusicState() });
    } catch (error: any) {
        console.error("Error adding and playing:", error);
        res.status(500).json({ error: error.message || "Failed to add and play" });
    }
});

/**
 * DELETE /music/queue/:index
 * Remove item from queue by index
 */
router.delete("/queue/:index", (req: Request, res: Response) => {
    const index = parseInt(req.params.index, 10);

    if (isNaN(index)) {
        return res.status(400).json({ error: "Invalid index" });
    }

    removeFromQueue(index);
    broadcastState();
    res.json({ success: true, state: getMusicState() });
});

/**
 * POST /music/queue/move
 * Move item in queue
 */
router.post("/queue/move", (req: Request, res: Response) => {
    const { from, to } = req.body;

    if (typeof from !== "number" || typeof to !== "number") {
        return res.status(400).json({ error: "from and to indices are required" });
    }

    moveInQueue(from, to);
    broadcastState();
    res.json({ success: true, state: getMusicState() });
});

/**
 * POST /music/queue/move-to-top
 * Move item to top of queue (plays next)
 */
router.post("/queue/move-to-top", (req: Request, res: Response) => {
    const { index } = req.body;

    if (typeof index !== "number") {
        return res.status(400).json({ error: "index is required" });
    }

    moveToTop(index);
    broadcastState();
    res.json({ success: true, state: getMusicState() });
});

/**
 * DELETE /music/queue/clear
 * Clear queue (keeps current playing)
 */
router.delete("/queue/clear", (req: Request, res: Response) => {
    clearQueue();
    broadcastState();
    res.json({ success: true, state: getMusicState() });
});

/**
 * POST /music/queue/play/:index
 * Play specific item in queue
 */
router.post("/queue/play/:index", (req: Request, res: Response) => {
    const index = parseInt(req.params.index, 10);

    if (isNaN(index)) {
        return res.status(400).json({ error: "Invalid index" });
    }

    playAtIndex(index);
    broadcastState();
    res.json({ success: true, state: getMusicState() });
});

// ==================== PLAYBACK CONTROL ROUTES ====================

/**
 * POST /music/next
 * Play next track
 */
router.post("/next", (req: Request, res: Response) => {
    playNext();
    broadcastState();
    res.json({ success: true, state: getMusicState() });
});

/**
 * POST /music/previous
 * Play previous track
 */
router.post("/previous", (req: Request, res: Response) => {
    playPrevious();
    broadcastState();
    res.json({ success: true, state: getMusicState() });
});

/**
 * POST /music/loop
 * Set loop mode (off/one/all)
 */
router.post("/loop", (req: Request, res: Response) => {
    const { mode } = req.body;

    if (!mode || !["off", "one", "all"].includes(mode)) {
        return res.status(400).json({ error: "Valid mode is required (off/one/all)" });
    }

    setLoopMode(mode as LoopMode);
    broadcastState();
    res.json({ success: true, state: getMusicState() });
});

/**
 * POST /music/shuffle
 * Toggle shuffle mode
 */
router.post("/shuffle", (req: Request, res: Response) => {
    toggleShuffle();
    broadcastState();
    res.json({ success: true, state: getMusicState() });
});

/**
 * POST /music/ended
 * Called when current track ends (for auto-play next)
 */
router.post("/ended", (req: Request, res: Response) => {
    onSongEnd();
    broadcastState();
    res.json({ success: true, state: getMusicState() });
});

export default router;
