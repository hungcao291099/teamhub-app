import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/services/api";
import { toast } from "sonner";

export interface AddedByInfo {
    userId: number;
    username: string;
}

export interface MusicInfo {
    url: string;
    audioUrl: string;
    title: string;
    duration: number;
    thumbnail: string;
    platform: "youtube" | "soundcloud" | "direct";
    artist?: string;
    addedBy?: AddedByInfo;
}

export type LoopMode = "off" | "one" | "all";
export type VoteActionType = 'skip' | 'previous' | 'pause' | 'stop' | 'delete';

export interface VoteState {
    actionType: VoteActionType;
    songTitle: string;
    initiatorId: number;
    initiatorName: string;
    targetIndex?: number;
    votes: number[];
    requiredVotes: number;
    startedAt: number;
    expiresAt: number;
}

export interface MusicState {
    currentMusic: MusicInfo | null;
    isPlaying: boolean;
    startedAt: number | null;
    pausedAt: number | null;
    queue: MusicInfo[];
    currentIndex: number;
    loopMode: LoopMode;
    shuffleEnabled: boolean;
    shuffleOrder: number[];
}

interface MusicContextType {
    musicState: MusicState;
    currentTime: number;
    volume: number;
    isMuted: boolean;
    // Basic playback
    play: () => void;
    pause: () => void;
    stop: () => void;
    seek: (position: number) => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    // Queue management
    addToQueue: (url: string) => Promise<void>;
    removeFromQueue: (index: number) => void;
    moveInQueue: (from: number, to: number) => void;
    moveToTop: (index: number) => void;
    clearQueue: () => void;
    // Playback control
    playNext: () => void;
    playPrevious: () => void;
    setLoopMode: (mode: LoopMode) => void;
    toggleShuffle: () => void;
    // Voting
    voteState: VoteState | null;
    isOwner: boolean;
    executeAction: (actionType: VoteActionType, targetIndex?: number) => Promise<void>;
    submitVote: () => void;
    cancelVote: () => void;
    // Status
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

const initialState: MusicState = {
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

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { socket, currentUser } = useAuth();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const [musicState, setMusicState] = useState<MusicState>(initialState);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolumeState] = useState(() => {
        const saved = localStorage.getItem("musicVolume");
        return saved ? parseFloat(saved) : 0.5;
    });
    const [isMuted, setIsMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [voteState, setVoteState] = useState<VoteState | null>(null);

    // Computed: Check if current user owns the playing song
    const isOwner = currentUser?.id === musicState.currentMusic?.addedBy?.userId;

    // Action name mapping for Vietnamese
    const actionNames: Record<VoteActionType, string> = {
        skip: "bỏ qua bài hát",
        previous: "quay lại bài trước",
        pause: "tạm dừng",
        stop: "dừng phát",
        delete: "xóa bài hát"
    };

    // Initialize audio element
    useEffect(() => {
        const audio = new Audio();
        audioRef.current = audio;

        audio.addEventListener("timeupdate", () => {
            setCurrentTime(audio.currentTime);
        });

        audio.addEventListener("ended", () => {
            api.post("/music/ended").catch(console.error);
        });

        audio.addEventListener("error", (_e) => {
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
                        errorMessage = "Link audio đã hết hạn. Vui lòng thêm lại nhạc.";
                        break;
                }
            }
            setError(errorMessage);
        });

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
        }
    }, [volume, isMuted]);

    // Handle socket events
    useEffect(() => {
        if (!socket) return;

        const handleMusicState = (state: MusicState) => {
            setMusicState(state);
            setError(null);
        };

        const handleQueueAdded = (data: { title: string; addedBy: string; thumbnail: string }) => {
            toast.success(`${data.addedBy} đã thêm bài hát`, {
                description: data.title,
                duration: 5000,
            });
        };

        const handleVoteState = (vote: VoteState) => {
            setVoteState(vote);
        };

        const handleVoteEnd = (data: { vote: VoteState | null; result: 'passed' | 'failed' | 'cancelled' | 'expired' }) => {
            setVoteState(null);
            const actionName = data.vote ? actionNames[data.vote.actionType] : "hành động";

            switch (data.result) {
                case 'passed':
                    toast.success(`Vote thành công!`, {
                        description: `Đã ${actionName}`,
                        duration: 3000,
                    });
                    break;
                case 'cancelled':
                    toast.info(`Vote đã bị hủy`, {
                        description: `${data.vote?.initiatorName} đã hủy vote ${actionName}`,
                        duration: 3000,
                    });
                    break;
                case 'expired':
                    toast.warning(`Vote hết hạn`, {
                        description: `Không đủ số vote để ${actionName}`,
                        duration: 3000,
                    });
                    break;
            }
        };

        const handleActionExecuted = (data: { actionType: VoteActionType; userId: number; username: string }) => {
            toast.success(`${data.username} đã ${actionNames[data.actionType]}`, {
                duration: 3000
            });
        };

        socket.on("music:state", handleMusicState);
        socket.on("music:queue_added", handleQueueAdded);
        socket.on("music:vote_state", handleVoteState);
        socket.on("music:vote_end", handleVoteEnd);
        socket.on("music:action_executed", handleActionExecuted);
        socket.emit("music:get_state");

        return () => {
            socket.off("music:state", handleMusicState);
            socket.off("music:queue_added", handleQueueAdded);
            socket.off("music:vote_state", handleVoteState);
            socket.off("music:vote_end", handleVoteEnd);
            socket.off("music:action_executed", handleActionExecuted);
        };
    }, [socket, actionNames]);

    // Sync audio playback with state
    useEffect(() => {
        if (!audioRef.current) return;

        const effectiveVolume = isMuted ? 0 : volume;
        audioRef.current.volume = effectiveVolume;

        if (musicState.currentMusic?.audioUrl) {
            if (audioRef.current.src !== musicState.currentMusic.audioUrl) {
                audioRef.current.src = musicState.currentMusic.audioUrl;
            }

            if (musicState.isPlaying) {
                if (musicState.startedAt) {
                    const position = (Date.now() - musicState.startedAt) / 1000;
                    if (Math.abs(audioRef.current.currentTime - position) > 2) {
                        audioRef.current.currentTime = position;
                    }
                }
                audioRef.current.play().catch(console.error);
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

    // ==================== Playback ====================

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

    // ==================== Queue Management ====================

    const addToQueue = useCallback(async (url: string) => {
        setIsLoading(true);
        setError(null);
        try {
            await api.post("/music/queue/add", {
                url,
                userId: currentUser?.id,
                username: currentUser?.username
            });
        } catch (err: any) {
            setError(err.response?.data?.error || "Không thể thêm vào queue");
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    const removeFromQueue = useCallback((index: number) => {
        api.delete(`/music/queue/${index}`).catch(console.error);
    }, []);

    const moveInQueue = useCallback((from: number, to: number) => {
        api.post("/music/queue/move", { from, to }).catch(console.error);
    }, []);

    const moveToTop = useCallback((index: number) => {
        api.post("/music/queue/move-to-top", { index }).catch(console.error);
    }, []);

    const clearQueue = useCallback(() => {
        api.delete("/music/queue/clear").catch(console.error);
    }, []);

    // ==================== Playback Control ====================

    const playNext = useCallback(() => {
        api.post("/music/next").catch(console.error);
    }, []);

    const playPrevious = useCallback(() => {
        api.post("/music/previous").catch(console.error);
    }, []);

    const setLoopMode = useCallback((mode: LoopMode) => {
        api.post("/music/loop", { mode }).catch(console.error);
    }, []);

    const toggleShuffle = useCallback(() => {
        api.post("/music/shuffle").catch(console.error);
    }, []);

    // ==================== Voting Functions ====================

    const executeAction = useCallback(async (actionType: VoteActionType, targetIndex?: number) => {
        try {
            const response = await api.post("/music/action", {
                actionType,
                userId: currentUser?.id,
                username: currentUser?.username,
                targetIndex
            });

            if (!response.data.executed) {
                // Vote started (show only to initiator)
                toast.info(`Đã bắt đầu vote để ${actionNames[actionType]}`, {
                    description: `Cần ${response.data.vote.requiredVotes} vote để thực hiện`,
                    duration: 3000
                });
            }
            // For executed=true, socket broadcast will show toast to all users
        } catch (err: any) {
            const message = err.response?.data?.error || "Không thể thực hiện hành động";
            toast.error(message);
        }
    }, [currentUser, actionNames]);

    const submitVoteAction = useCallback(() => {
        if (!voteState) return;
        api.post("/music/vote", { userId: currentUser?.id })
            .then(() => {
                toast.success("Đã vote!", { duration: 2000 });
            })
            .catch((err) => {
                toast.error(err.response?.data?.error || "Không thể vote");
            });
    }, [currentUser, voteState]);

    const cancelVoteAction = useCallback(() => {
        api.post("/music/vote/cancel", { userId: currentUser?.id })
            .catch((err) => {
                toast.error(err.response?.data?.error || "Không thể hủy vote");
            });
    }, [currentUser]);

    const value: MusicContextType = {
        musicState,
        currentTime,
        volume,
        isMuted,
        play,
        pause,
        stop,
        seek,
        setVolume,
        toggleMute,
        addToQueue,
        removeFromQueue,
        moveInQueue,
        moveToTop,
        clearQueue,
        playNext,
        playPrevious,
        setLoopMode,
        toggleShuffle,
        // Voting
        voteState,
        isOwner,
        executeAction,
        submitVote: submitVoteAction,
        cancelVote: cancelVoteAction,
        // Status
        isLoading,
        error
    };

    return (
        <MusicContext.Provider value={value}>
            {children}
        </MusicContext.Provider>
    );
};
