import React, { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Music,
    Play,
    Pause,
    Square,
    Volume2,
    VolumeX,
    Loader2,
    Youtube,
    Cloud,
    Link as LinkIcon,
    AlertCircle,
    SkipBack,
    SkipForward,
    Repeat,
    Repeat1,
    Shuffle,
    ListMusic,
    Trash2,
    ArrowUp,
    GripVertical,
    Plus,
    User
} from "lucide-react";
import { useMusic, MusicInfo, LoopMode } from "@/context/MusicContext";
import { VotingOverlay } from "@/components/music/VotingOverlay";
import { MusicLiveChat } from "@/components/music/MusicLiveChat";
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

const PlatformIcon: React.FC<{ platform?: string }> = ({ platform }) => {
    switch (platform) {
        case "youtube": return <Youtube className="w-3.5 h-3.5 text-red-500" />;
        case "soundcloud": return <Cloud className="w-3.5 h-3.5 text-orange-500" />;
        default: return <LinkIcon className="w-3.5 h-3.5 text-gray-500" />;
    }
};

interface SortableQueueItemProps {
    id: string;
    item: MusicInfo;
    index: number;
    isPlaying: boolean;
    isCurrent: boolean;
    currentIndex: number;
    onRemove: () => void;
    onMoveToTop: () => void;
}

const SortableQueueItem: React.FC<SortableQueueItemProps> = ({
    id, item, index, isPlaying, isCurrent, currentIndex, onRemove, onMoveToTop
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.8 : 1
    };

    const canMoveToTop = index > currentIndex + 1;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors group",
                isCurrent ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50",
                isDragging && "shadow-lg bg-card border border-border"
            )}
        >
            {/* Drag Handle */}
            <div {...attributes} {...listeners} className="text-muted-foreground cursor-grab active:cursor-grabbing opacity-50 group-hover:opacity-100 transition-opacity touch-none">
                <GripVertical className="w-4 h-4" />
            </div>

            {/* Index */}
            <div className="w-6 text-center text-sm text-muted-foreground">
                {isCurrent && isPlaying ? (
                    <div className="flex gap-0.5 justify-center">
                        <div className="w-0.5 h-3 bg-primary animate-pulse" />
                        <div className="w-0.5 h-3 bg-primary animate-pulse" style={{ animationDelay: "150ms" }} />
                        <div className="w-0.5 h-3 bg-primary animate-pulse" style={{ animationDelay: "300ms" }} />
                    </div>
                ) : (
                    <span>{index + 1}</span>
                )}
            </div>

            {/* Thumbnail */}
            <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-muted">
                {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-4 h-4 text-muted-foreground" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <PlatformIcon platform={item.platform} />
                    <p className={cn("font-medium truncate text-sm", isCurrent && "text-primary")}>{item.title}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{item.artist || "Unknown"}</span>
                    <span>•</span>
                    <span>{formatTime(item.duration)}</span>
                    {item.addedBy && (
                        <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {item.addedBy.username}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {canMoveToTop && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveToTop} title="Play Next">
                        <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onRemove} title="Remove">
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    );
};

const MusicPage: React.FC = () => {
    const { currentUser } = useAuth();
    const {
        musicState, currentTime, volume, isMuted,
        play, seek, setVolume, toggleMute,
        addToQueue, removeFromQueue, moveInQueue, moveToTop, clearQueue,
        setLoopMode, toggleShuffle,
        executeAction, isOwner,
        isLoading, error
    } = useMusic();

    const [url, setUrl] = useState("");
    const [isSeeking, setIsSeeking] = useState(false);
    const [seekValue, setSeekValue] = useState(0);

    const hasMusic = !!musicState.currentMusic;
    const isPlaying = musicState.isPlaying;
    const duration = musicState.currentMusic?.duration || 0;
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    // Chỉ user đã add bài nhạc mới được phép tua
    const canSeek = isOwner;

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const queueIds = musicState.queue.map((item, index) => `${item.url}-${index}`);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = queueIds.indexOf(active.id as string);
            const newIndex = queueIds.indexOf(over.id as string);
            if (oldIndex !== -1 && newIndex !== -1) {
                moveInQueue(oldIndex, newIndex);
            }
        }
    };

    const handleAddToQueue = async () => {
        if (!url.trim()) return;
        try {
            await addToQueue(url);
            setUrl("");
        } catch (err) { }
    };

    const handleSeekChange = (value: number[]) => {
        setIsSeeking(true);
        setSeekValue(value[0]);
    };

    const handleSeekCommit = (value: number[]) => {
        if (duration > 0) {
            seek((value[0] / 100) * duration);
        }
        setIsSeeking(false);
    };

    const cycleLoopMode = () => {
        const nextMode: Record<LoopMode, LoopMode> = { off: "all", all: "one", one: "off" };
        setLoopMode(nextMode[musicState.loopMode]);
    };

    // Check if user can delete a song directly (owns it) or needs to vote
    const handleRemoveFromQueue = useCallback((index: number) => {
        const song = musicState.queue[index];
        // If user owns the song, delete directly
        if (song?.addedBy?.userId === currentUser?.id) {
            removeFromQueue(index);
        } else {
            // Otherwise, vote to delete
            executeAction('delete', index);
        }
    }, [musicState.queue, currentUser?.id, removeFromQueue, executeAction]);

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            {/* Main Music Content */}
            <div className="flex-1 overflow-auto">
                <div className="container max-w-4xl mx-auto py-8 px-4">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary">
                                <Music className="w-8 h-8 text-primary-foreground" />
                            </div>
                            Nhạc nền
                        </h1>
                        <p className="text-muted-foreground mt-2">Phát nhạc nền cho tất cả thành viên trong team</p>
                    </div>

                    {/* Add to Queue - Simple */}
                    <Card className="mb-6">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Thêm nhạc vào hàng đợi</CardTitle>
                            <CardDescription>Paste link YouTube hoặc SoundCloud</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="https://www.youtube.com/watch?v=... hoặc https://soundcloud.com/..."
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddToQueue()}
                                    disabled={isLoading}
                                />
                                <Button onClick={handleAddToQueue} disabled={!url.trim() || isLoading} className="px-6">
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" />Thêm</>}
                                </Button>
                            </div>
                            {error && (
                                <div className="flex items-center gap-2 p-3 mt-3 rounded-lg bg-destructive/10 text-destructive">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Now Playing */}
                    {hasMusic && (
                        <Card className="mb-6 overflow-hidden">
                            <div className={cn("h-32 relative", "bg-gradient-to-br from-primary via-primary/80 to-primary/60")}>
                                {musicState.currentMusic?.thumbnail && (
                                    <img src={musicState.currentMusic.thumbnail} alt="Thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-40 blur-sm" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-3 left-4 right-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <PlatformIcon platform={musicState.currentMusic?.platform} />
                                        {musicState.queue.length > 1 && (
                                            <span className="text-white/70 text-xs">{musicState.currentIndex + 1} / {musicState.queue.length}</span>
                                        )}
                                        {musicState.currentMusic?.addedBy && (
                                            <span className="text-white/70 text-xs flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {musicState.currentMusic.addedBy.username}
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-xl font-bold text-white truncate">{musicState.currentMusic?.title}</h2>
                                    {musicState.currentMusic?.artist && <p className="text-white/70 text-sm">{musicState.currentMusic.artist}</p>}
                                </div>
                            </div>

                            <CardContent className="pt-4">
                                {/* Progress */}
                                <div className="mb-4">
                                    <Slider
                                        value={[isSeeking ? seekValue : progress]}
                                        onValueChange={handleSeekChange}
                                        onValueCommit={handleSeekCommit}
                                        max={100}
                                        step={0.1}
                                        className={cn("cursor-pointer", !canSeek && "opacity-50 pointer-events-none")}
                                        disabled={!canSeek}
                                    />
                                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                                        <span>{formatTime(currentTime)}</span>
                                        <span>{formatTime(duration)}</span>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={toggleShuffle} className={cn("h-9 w-9 rounded-full", musicState.shuffleEnabled && "text-primary")} title={musicState.shuffleEnabled ? "Shuffle On" : "Shuffle Off"}>
                                            <Shuffle className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => executeAction('previous')} disabled={isLoading || musicState.queue.length <= 1}>
                                            <SkipBack className="w-4 h-4" />
                                        </Button>
                                        <Button size="lg" className={cn("h-12 w-12 rounded-full", isPlaying && "bg-primary hover:bg-primary/90")} onClick={() => isPlaying ? executeAction('pause') : play()} disabled={isLoading}>
                                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => executeAction('skip')} disabled={isLoading || musicState.queue.length <= 1}>
                                            <SkipForward className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={cycleLoopMode} className={cn("h-9 w-9 rounded-full", musicState.loopMode !== "off" && "text-primary")} title={`Loop: ${musicState.loopMode}`}>
                                            {musicState.loopMode === "one" ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                                        </Button>
                                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full ml-2" onClick={() => executeAction('stop')} disabled={isLoading} title="Stop">
                                            <Square className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
                                            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                        </Button>
                                        <Slider value={[isMuted ? 0 : volume * 100]} onValueChange={([val]) => setVolume(val / 100)} max={100} step={1} className="w-24" />
                                        <span className="text-xs text-muted-foreground w-7">{Math.round(isMuted ? 0 : volume * 100)}%</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Queue */}
                    {musicState.queue.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ListMusic className="w-5 h-5" />
                                        <CardTitle>Hàng đợi</CardTitle>
                                        <span className="text-sm text-muted-foreground">({musicState.queue.length} bài)</span>
                                    </div>
                                    {musicState.queue.length > 1 && (
                                        <Button variant="ghost" size="sm" onClick={clearQueue} className="text-muted-foreground hover:text-destructive">
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Xóa tất cả
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={queueIds} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-1 max-h-96 overflow-y-auto">
                                            {musicState.queue.map((item, index) => (
                                                <SortableQueueItem
                                                    key={queueIds[index]}
                                                    id={queueIds[index]}
                                                    item={item}
                                                    index={index}
                                                    isPlaying={isPlaying}
                                                    isCurrent={index === musicState.currentIndex}
                                                    currentIndex={musicState.currentIndex}
                                                    onRemove={() => handleRemoveFromQueue(index)}
                                                    onMoveToTop={() => moveToTop(index)}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </CardContent>
                        </Card>
                    )}

                    {/* Empty state */}
                    {musicState.queue.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">Chưa có bài hát nào trong hàng đợi</p>
                                <p className="text-sm text-muted-foreground mt-1">Thêm bài hát bằng cách paste link ở trên</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Voting Overlay */}
                    <VotingOverlay />
                </div>
            </div>

            {/* Live Chat Sidebar */}
            <div className="hidden lg:block w-80 xl:w-96 h-full">
                <MusicLiveChat className="h-full" />
            </div>
        </div>
    );
};

export default MusicPage;
