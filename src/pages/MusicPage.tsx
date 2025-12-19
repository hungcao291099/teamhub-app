import React, { useState } from "react";
import {
    Music,
    Play,
    Pause,
    Square,
    Volume2,
    VolumeX,
    Search,
    Loader2,
    Youtube,
    Cloud,
    Link as LinkIcon,
    AlertCircle
} from "lucide-react";
import { useMusic, MusicInfo } from "@/context/MusicContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const PlatformBadge: React.FC<{ platform?: string }> = ({ platform }) => {
    const config = {
        youtube: {
            icon: Youtube,
            label: "YouTube",
            color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        },
        soundcloud: {
            icon: Cloud,
            label: "SoundCloud",
            color: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
        },
        direct: {
            icon: LinkIcon,
            label: "Direct URL",
            color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        }
    }[platform || "direct"] || {
        icon: Music,
        label: "Unknown",
        color: "bg-gray-100 text-gray-600"
    };

    const Icon = config.icon;

    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            config.color
        )}>
            <Icon className="w-3.5 h-3.5" />
            {config.label}
        </span>
    );
};

const MusicPage: React.FC = () => {
    const {
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
    } = useMusic();

    const [url, setUrl] = useState("");
    const [preview, setPreview] = useState<MusicInfo | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    const hasMusic = !!musicState.currentMusic;
    const isPlaying = musicState.isPlaying;
    const duration = musicState.currentMusic?.duration || 0;
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    const handlePreview = async () => {
        if (!url.trim()) return;

        setPreviewLoading(true);
        setPreviewError(null);
        setPreview(null);

        try {
            const info = await previewMusic(url);
            setPreview(info);
        } catch (err: any) {
            setPreviewError(err.message || "Không thể lấy thông tin nhạc");
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleSetMusic = async () => {
        if (!url.trim()) return;

        try {
            await setMusicFromUrl(url);
            setUrl("");
            setPreview(null);
        } catch (err) {
            // Error handled in context
        }
    };

    const handleSeek = (value: number[]) => {
        if (duration > 0) {
            seek((value[0] / 100) * duration);
        }
    };

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary">
                        <Music className="w-8 h-8 text-primary-foreground" />
                    </div>
                    Nhạc nền
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Phát nhạc nền cho tất cả thành viên trong team
                </p>
            </div>

            {/* Current Playing */}
            <Card className="mb-6 overflow-hidden">
                <div className={cn(
                    "h-48 relative",
                    "bg-gradient-to-br from-primary via-primary/80 to-primary/60"
                )}>
                    {musicState.currentMusic?.thumbnail && (
                        <img
                            src={musicState.currentMusic.thumbnail}
                            alt="Thumbnail"
                            className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    <div className="absolute bottom-4 left-4 right-4">
                        {hasMusic ? (
                            <>
                                <div className="flex items-center gap-2 mb-1">
                                    <PlatformBadge platform={musicState.currentMusic?.platform} />
                                </div>
                                <h2 className="text-2xl font-bold text-white truncate">
                                    {musicState.currentMusic?.title}
                                </h2>
                                {musicState.currentMusic?.artist && (
                                    <p className="text-white/70">
                                        {musicState.currentMusic.artist}
                                    </p>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <Music className="w-16 h-16 text-white/50 mx-auto mb-4" />
                                <p className="text-white/70 text-lg">
                                    Chưa có nhạc đang phát
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {hasMusic && (
                    <CardContent className="pt-4">
                        {/* Progress */}
                        <div className="mb-4">
                            <Slider
                                value={[progress]}
                                onValueChange={handleSeek}
                                max={100}
                                step={0.1}
                                className="cursor-pointer"
                            />
                            <div className="flex justify-between text-sm text-gray-500 mt-1">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Button
                                    size="lg"
                                    className={cn(
                                        "h-14 w-14 rounded-full",
                                        isPlaying && "bg-primary hover:bg-primary/90"
                                    )}
                                    onClick={isPlaying ? pause : play}
                                    disabled={isLoading}
                                >
                                    {isPlaying ? (
                                        <Pause className="w-6 h-6" />
                                    ) : (
                                        <Play className="w-6 h-6 ml-0.5" />
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="h-12 w-12 rounded-full"
                                    onClick={stop}
                                    disabled={isLoading}
                                >
                                    <Square className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Volume */}
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleMute}
                                >
                                    {isMuted || volume === 0 ? (
                                        <VolumeX className="w-5 h-5" />
                                    ) : (
                                        <Volume2 className="w-5 h-5" />
                                    )}
                                </Button>
                                <Slider
                                    value={[isMuted ? 0 : volume * 100]}
                                    onValueChange={([val]) => setVolume(val / 100)}
                                    max={100}
                                    step={1}
                                    className="w-32"
                                />
                                <span className="text-sm text-gray-500 w-8">
                                    {Math.round(isMuted ? 0 : volume * 100)}%
                                </span>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Set New Music */}
            <Card>
                <CardHeader>
                    <CardTitle>Thêm nhạc mới</CardTitle>
                    <CardDescription>
                        Dán link YouTube hoặc SoundCloud để phát nhạc cho tất cả
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 mb-4">
                        <Input
                            placeholder="https://www.youtube.com/watch?v=... hoặc https://soundcloud.com/..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handlePreview()}
                            disabled={isLoading || previewLoading}
                        />
                        <Button
                            variant="outline"
                            onClick={handlePreview}
                            disabled={!url.trim() || previewLoading}
                        >
                            {previewLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Search className="w-4 h-4" />
                            )}
                        </Button>
                    </div>

                    {/* Error */}
                    {(error || previewError) && (
                        <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">{error || previewError}</span>
                        </div>
                    )}

                    {/* Preview */}
                    {preview && (
                        <div className="border rounded-lg p-4 mb-4 dark:border-gray-700">
                            <div className="flex gap-4">
                                {preview.thumbnail && (
                                    <img
                                        src={preview.thumbnail}
                                        alt="Thumbnail"
                                        className="w-24 h-24 rounded-lg object-cover"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <PlatformBadge platform={preview.platform} />
                                    <h3 className="font-semibold mt-2 truncate">
                                        {preview.title}
                                    </h3>
                                    {preview.artist && (
                                        <p className="text-sm text-gray-500">
                                            {preview.artist}
                                        </p>
                                    )}
                                    <p className="text-sm text-gray-500 mt-1">
                                        Thời lượng: {formatTime(preview.duration)}
                                    </p>
                                </div>
                            </div>
                            <Button
                                className="w-full mt-4 bg-primary hover:bg-primary/90"
                                onClick={handleSetMusic}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Phát cho tất cả
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {/* Quick tips */}
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        <p className="font-medium mb-2">Hỗ trợ:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>YouTube - youtube.com/watch?v=...</li>
                            <li>SoundCloud - soundcloud.com/...</li>
                            <li>Direct MP3/Audio URL</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default MusicPage;
