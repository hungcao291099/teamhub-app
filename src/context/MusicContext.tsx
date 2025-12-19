import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";

export interface MusicInfo {
    url: string;
    audioUrl: string;
    title: string;
    duration: number;
    thumbnail: string;
    platform: "youtube" | "soundcloud" | "direct";
    artist?: string;
}

export interface MusicState {
    currentMusic: MusicInfo | null;
    isPlaying: boolean;
    startedAt: number | null;
    pausedAt: number | null;
}

interface MusicContextType {
    musicState: MusicState;
    currentTime: number;
    volume: number;
    isMuted: boolean;
    setMusicFromUrl: (url: string) => Promise<void>;
    previewMusic: (url: string) => Promise<MusicInfo>;
    play: () => void;
    pause: () => void;
    stop: () => void;
    seek: (position: number) => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    isLoading: boolean;
    error: string | null;
}

const MusicContext = createContext<MusicContextType | null>(null);

export const useMusic = () => {
    const context = useContext(MusicContext);
    if (!context) {
        throw new Error("useMusic must be used within MusicProvider");
    }
    return context;
};

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { socket } = useAuth();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [musicState, setMusicState] = useState<MusicState>({
        currentMusic: null,
        isPlaying: false,
        startedAt: null,
        pausedAt: null
    });
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolumeState] = useState(() => {
        const saved = localStorage.getItem("musicVolume");
        return saved ? parseFloat(saved) : 0.5;
    });
    const [isMuted, setIsMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize audio element (simple approach - no CORS issues)
    useEffect(() => {
        const audio = new Audio();
        // DO NOT set crossOrigin - it causes CORS issues with YouTube
        audioRef.current = audio;

        audio.addEventListener("timeupdate", () => {
            setCurrentTime(audio.currentTime);
        });

        audio.addEventListener("ended", () => {
            setMusicState(prev => ({ ...prev, isPlaying: false }));
        });

        audio.addEventListener("error", (e) => {
            const audioError = audio.error;
            let errorMessage = "Không thể phát audio";

            if (audioError) {
                switch (audioError.code) {
                    case MediaError.MEDIA_ERR_ABORTED:
                        errorMessage = "Phát lại bị hủy";
                        break;
                    case MediaError.MEDIA_ERR_NETWORK:
                        errorMessage = "Lỗi mạng khi tải audio";
                        break;
                    case MediaError.MEDIA_ERR_DECODE:
                        errorMessage = "Không thể giải mã audio";
                        break;
                    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        errorMessage = "Link audio đã hết hạn hoặc không hỗ trợ. Vui lòng set lại nhạc.";
                        break;
                }
                console.error("Audio error:", audioError.code, audioError.message);
            } else {
                console.error("Audio error event:", e);
            }

            setError(errorMessage);
        });

        // Apply initial volume
        audio.volume = volume;

        return () => {
            audio.pause();
            audio.src = "";
            audioRef.current = null;
        };
    }, []);

    // Update volume
    useEffect(() => {
        localStorage.setItem("musicVolume", volume.toString());
        const effectiveVolume = isMuted ? 0 : volume;

        if (audioRef.current) {
            audioRef.current.volume = effectiveVolume;
            console.log("Volume set to:", effectiveVolume);
        }
    }, [volume, isMuted]);

    // Handle socket music state updates
    useEffect(() => {
        if (!socket) return;

        const handleMusicState = (state: MusicState) => {
            console.log("Received music state:", state);
            setMusicState(state);
            setError(null);
        };

        socket.on("music:state", handleMusicState);

        // Request current state on connect
        socket.emit("music:get_state");

        return () => {
            socket.off("music:state", handleMusicState);
        };
    }, [socket]);

    // Sync audio playback with state
    useEffect(() => {
        if (!audioRef.current) return;

        // Apply current volume
        const effectiveVolume = isMuted ? 0 : volume;
        audioRef.current.volume = effectiveVolume;

        if (musicState.currentMusic?.audioUrl) {
            // Check if we need to change source
            if (audioRef.current.src !== musicState.currentMusic.audioUrl) {
                audioRef.current.src = musicState.currentMusic.audioUrl;
            }

            if (musicState.isPlaying) {

                // Calculate current position based on startedAt
                if (musicState.startedAt) {
                    const position = (Date.now() - musicState.startedAt) / 1000;
                    // Only seek if difference is significant (to avoid constant seeking)
                    if (Math.abs(audioRef.current.currentTime - position) > 2) {
                        audioRef.current.currentTime = position;
                    }
                }
                audioRef.current.play().catch(err => {
                    console.error("Play failed:", err);
                    // Auto-play may be blocked, user needs to interact
                });
            } else {
                audioRef.current.pause();
                if (musicState.pausedAt !== null) {
                    audioRef.current.currentTime = musicState.pausedAt;
                }
            }
        } else {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
    }, [musicState, volume, isMuted]);

    const setMusicFromUrl = useCallback(async (url: string) => {
        setIsLoading(true);
        setError(null);
        try {
            await api.post("/music/set", { url });
            // State will be updated via socket
        } catch (err: any) {
            setError(err.response?.data?.error || "Không thể set nhạc");
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const previewMusic = useCallback(async (url: string): Promise<MusicInfo> => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.post("/music/preview", { url });
            return res.data.info;
        } catch (err: any) {
            setError(err.response?.data?.error || "Không thể preview nhạc");
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const play = useCallback(() => {
        api.post("/music/play").catch(console.error);
    }, []);

    const pause = useCallback(() => {
        api.post("/music/pause").catch(console.error);
    }, []);

    const stop = useCallback(() => {
        api.post("/music/stop").catch(console.error);
    }, []);

    const seek = useCallback((position: number) => {
        api.post("/music/seek", { position }).catch(console.error);
        if (audioRef.current) {
            audioRef.current.currentTime = position;
        }
    }, []);

    const setVolume = useCallback((newVolume: number) => {
        setVolumeState(Math.max(0, Math.min(1, newVolume)));
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    const value: MusicContextType = {
        musicState,
        currentTime,
        volume,
        isMuted,
        setMusicFromUrl,
        previewMusic,
        play,
        pause,
        stop,
        seek,
        setVolume,
        toggleMute,
        isLoading,
        error
    };

    return (
        <MusicContext.Provider value={value}>
            {children}
        </MusicContext.Provider>
    );
};
