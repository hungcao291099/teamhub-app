import React from "react";
import { useNavigate } from "react-router-dom";
import {
    Play,
    Pause,
    Square,
    Volume2,
    VolumeX,
    ExternalLink,
    Music,
    Youtube,
    Cloud
} from "lucide-react";
import { useMusic } from "@/context/MusicContext";
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
        case "youtube":
            return <Youtube className="w-4 h-4 text-red-500" />;
        case "soundcloud":
            return <Cloud className="w-4 h-4 text-orange-500" />;
        default:
            return <Music className="w-4 h-4 text-gray-500" />;
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
        pause,
        stop,
        setVolume,
        toggleMute,
        isLoading
    } = useMusic();

    const hasMusic = !!musicState.currentMusic;
    const isPlaying = musicState.isPlaying;
    const duration = musicState.currentMusic?.duration || 0;
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    const handleViewMore = () => {
        onClose?.();
        navigate("/music");
    };

    return (
        <div className={cn(
            "w-80 rounded-xl overflow-hidden",
            "bg-card",
            "border border-border",
            "shadow-2xl"
        )}>
            {/* Header with thumbnail or gradient */}
            <div className={cn(
                "h-24 relative",
                "bg-gradient-to-br from-primary via-primary/80 to-primary/60"
            )}>
                {musicState.currentMusic?.thumbnail && (
                    <img
                        src={musicState.currentMusic.thumbnail}
                        alt="Thumbnail"
                        className="absolute inset-0 w-full h-full object-cover opacity-50"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Title overlay */}
                <div className="absolute bottom-2 left-3 right-3">
                    <div className="flex items-center gap-2">
                        <PlatformIcon platform={musicState.currentMusic?.platform} />
                        <span className="text-white text-sm font-medium truncate">
                            {musicState.currentMusic?.title || "Chưa có nhạc"}
                        </span>
                    </div>
                    {musicState.currentMusic?.artist && (
                        <span className="text-white/70 text-xs">
                            {musicState.currentMusic.artist}
                        </span>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            {hasMusic && (
                <div className="px-3 py-2">
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="px-3 pb-3">
                <div className="flex items-center justify-between">
                    {/* Playback controls */}
                    <div className="flex items-center gap-2">
                        {hasMusic ? (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-full"
                                    onClick={isPlaying ? pause : play}
                                    disabled={isLoading}
                                >
                                    {isPlaying ? (
                                        <Pause className="w-5 h-5" />
                                    ) : (
                                        <Play className="w-5 h-5" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={stop}
                                    disabled={isLoading}
                                >
                                    <Square className="w-4 h-4" />
                                </Button>
                            </>
                        ) : (
                            <span className="text-sm text-gray-500">
                                Chưa có nhạc đang phát
                            </span>
                        )}
                    </div>

                    {/* Volume control */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={toggleMute}
                        >
                            {isMuted || volume === 0 ? (
                                <VolumeX className="w-4 h-4" />
                            ) : (
                                <Volume2 className="w-4 h-4" />
                            )}
                        </Button>
                        <Slider
                            value={[isMuted ? 0 : volume * 100]}
                            onValueChange={([val]) => setVolume(val / 100)}
                            max={100}
                            step={1}
                            className="w-16"
                        />
                    </div>
                </div>

                {/* View more button */}
                <Button
                    variant="outline"
                    className="w-full mt-3"
                    onClick={handleViewMore}
                >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Xem thêm & Cấu hình
                </Button>
            </div>
        </div>
    );
};
