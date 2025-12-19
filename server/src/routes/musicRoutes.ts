import { Router, Request, Response } from "express";
import {
    extractAudioInfo,
    getMusicState,
    setMusic,
    playMusic,
    pauseMusic,
    stopMusic,
    seekMusic,
    detectPlatform
} from "../services/MusicService";
import { getIO } from "../socket";

const router = Router();

/**
 * POST /music/set
 * Set music from URL (YouTube/SoundCloud/Direct)
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

        // Broadcast to all clients
        const io = getIO();
        io.emit("music:state", state);

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
    const state = playMusic();

    const io = getIO();
    io.emit("music:state", state);

    res.json({ success: true, state });
});

/**
 * POST /music/pause
 * Pause playback
 */
router.post("/pause", (req: Request, res: Response) => {
    const state = pauseMusic();

    const io = getIO();
    io.emit("music:state", state);

    res.json({ success: true, state });
});

/**
 * POST /music/stop
 * Stop playback
 */
router.post("/stop", (req: Request, res: Response) => {
    const state = stopMusic();

    const io = getIO();
    io.emit("music:state", state);

    res.json({ success: true, state });
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

    const state = seekMusic(position);

    const io = getIO();
    io.emit("music:state", state);

    res.json({ success: true, state });
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

export default router;
