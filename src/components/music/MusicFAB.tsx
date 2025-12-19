import React, { useState } from "react";
import { Music } from "lucide-react";
import { useMusic } from "@/context/MusicContext";
import { MusicMiniPlayer } from "./MusicMiniPlayer";
import { cn } from "@/lib/utils";

export const MusicFAB: React.FC = () => {
    const { musicState } = useMusic();
    const [isOpen, setIsOpen] = useState(false);

    const hasMusic = !!musicState.currentMusic;
    const isPlaying = musicState.isPlaying;

    return (
        <>
            {/* FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed top-4 right-4 z-50",
                    "w-12 h-12 rounded-full",
                    "flex items-center justify-center",
                    "shadow-lg transition-all duration-300",
                    "hover:scale-110 active:scale-95",
                    hasMusic && isPlaying
                        ? "bg-primary music-fab-playing"
                        : "bg-muted"
                )}
                title={hasMusic ? musicState.currentMusic?.title : "Nhạc nền"}
            >
                <Music className={cn(
                    "w-6 h-6",
                    hasMusic && isPlaying ? "text-primary-foreground" : "text-muted-foreground"
                )} />
            </button>

            {/* Mini Player Popup */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    {/* Mini Player */}
                    <div className="fixed top-18 right-4 z-50">
                        <MusicMiniPlayer onClose={() => setIsOpen(false)} />
                    </div>
                </>
            )}
        </>
    );
};
