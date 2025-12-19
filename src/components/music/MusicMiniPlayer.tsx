import React from "react";
import { useNavigate } from "react-router-dom";
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    ExternalLink,
    Music,
    Youtube,
    Cloud,
    SkipBack,
    SkipForward,
    Repeat,
    Repeat1,
    Shuffle,
    ListMusic,
    User
} from "lucide-react";
import { useMusic, LoopMode } from "@/context/MusicContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface MusicMiniPlayerProps {
    onClose?: () => void;
}

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const PlatformIcon: React.FC<{ platform?: string }> = ({ platform }) => {
    switch (platform) {
        case "youtube": return <Youtube className="w-4 h-4 text-red-500" />;
        case "soundcloud": return <Cloud className="w-4 h-4 text-orange-500" />;
        default: return <Music className="w-4 h-4 text-gray-500" />;
    }
};

export const MusicMiniPlayer: React.FC<MusicMiniPlayerProps> = ({ onClose }) => {
    const navigate = useNavigate();
    const {
        musicState,
        currentTime,
        volume,
        isMuted,
        play,
        setVolume,
        toggleMute,
        setLoopMode,
        toggleShuffle,
        executeAction,
        isLoading
    } = useMusic();

    const hasMusic = !!musicState.currentMusic;
    const isPlaying = musicState.isPlaying;
    const duration = musicState.currentMusic?.duration || 0;
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const hasQueue = musicState.queue.length > 1;

    const handleViewMore = () => {
        onClose?.();
        navigate("/music");
    };

    const cycleLoopMode = () => {
        const nextMode: Record<LoopMode, LoopMode> = { off: "all", all: "one", one: "off" };
        setLoopMode(nextMode[musicState.loopMode]);
    };

    return (
        <div className={cn("w-80 rounded-xl overflow-hidden", "bg-card", "border border-border", "shadow-2xl")}>
            {/* Header */}
            <div className={cn("h-20 relative", "bg-gradient-to-br from-primary via-primary/80 to-primary/60")}>
                {musicState.currentMusic?.thumbnail && (
                    <img src={musicState.currentMusic.thumbnail} alt="Thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                <div className="absolute bottom-2 left-3 right-3">
                    <div className="flex items-center gap-2">
                        <PlatformIcon platform={musicState.currentMusic?.platform} />
                        <span className="text-white text-sm font-medium truncate">
                            {musicState.currentMusic?.title || "Chưa có nhạc"}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70 text-xs">
                        {musicState.currentMusic?.artist && <span>{musicState.currentMusic.artist}</span>}
                        {hasQueue && (
                            <span className="flex items-center gap-1">
                                <ListMusic className="w-3 h-3" />
                                {musicState.currentIndex + 1}/{musicState.queue.length}
                            </span>
                        )}
                        {musicState.currentMusic?.addedBy && (
                            <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {musicState.currentMusic.addedBy.username}
                            </span>
                        )}
                    </div>
                </div>

                {/* Mode indicators */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                    {musicState.shuffleEnabled && (
                        <div className="bg-black/50 rounded-full p-1" title="Shuffle On">
                            <Shuffle className="w-3 h-3 text-primary" />
                        </div>
                    )}
                    {musicState.loopMode !== "off" && (
                        <div className="bg-black/50 rounded-full p-1" title={`Loop ${musicState.loopMode}`}>
                            {musicState.loopMode === "one" ? <Repeat1 className="w-3 h-3 text-primary" /> : <Repeat className="w-3 h-3 text-primary" />}
                        </div>
                    )}
                </div>
            </div>

            {/* Progress */}
            {hasMusic && (
                <div className="px-3 py-2">
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="px-3 pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        {hasMusic ? (
                            <>
                                <Button variant="ghost" size="icon" className={cn("h-7 w-7 rounded-full", musicState.shuffleEnabled && "text-primary")} onClick={toggleShuffle} title="Shuffle">
                                    <Shuffle className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => executeAction('previous')} disabled={isLoading || !hasQueue}>
                                    <SkipBack className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => isPlaying ? executeAction('pause') : play()} disabled={isLoading}>
                                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => executeAction('skip')} disabled={isLoading || !hasQueue}>
                                    <SkipForward className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className={cn("h-7 w-7 rounded-full", musicState.loopMode !== "off" && "text-primary")} onClick={cycleLoopMode} title={`Loop: ${musicState.loopMode}`}>
                                    {musicState.loopMode === "one" ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
                                </Button>
                            </>
                        ) : (
                            <span className="text-sm text-muted-foreground">Chưa có nhạc</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleMute}>
                            {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </Button>
                        <Slider value={[isMuted ? 0 : volume * 100]} onValueChange={([val]) => setVolume(val / 100)} max={100} step={1} className="w-14" />
                    </div>
                </div>

                <Button variant="outline" className="w-full mt-3" onClick={handleViewMore}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {hasQueue ? `Hàng đợi (${musicState.queue.length})` : "Mở Music"}
                </Button>
            </div>
        </div>
    );
};
