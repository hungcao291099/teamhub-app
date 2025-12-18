import React, { useState, useEffect, useRef } from "react";
import { chatApi, Message } from "@/services/chatApi";
import { Skeleton } from "@/components/ui/skeleton";
import { MediaPreview } from "../MediaPreview";

interface MediaListProps {
    conversationId: number;
}

// Sub-component to handle individual image loading state
const MediaItem = ({ msg, onClick }: { msg: Message, onClick: () => void }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className="aspect-square relative group overflow-hidden rounded-md bg-muted">
            {/* Skeleton overlay while image is loading */}
            {!isLoaded && (
                <Skeleton className="absolute inset-0 w-full h-full z-10" />
            )}

            <img
                src={msg.fileUrl || ""}
                alt="Media"
                className={`object-cover w-full h-full transition-all duration-300 hover:scale-105 cursor-pointer ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
                onLoad={() => setIsLoaded(true)}
                onClick={onClick}
            />
        </div>
    );
};

export const MediaList: React.FC<MediaListProps> = ({ conversationId }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedMedia, setSelectedMedia] = useState<{
        url: string;
        type: "image" | "video";
        fileName?: string;
    } | null>(null);
    const observerRef = useRef<HTMLDivElement>(null);
    const isFetching = useRef(false);

    // Initial load - fetch multiple pages for better coverage
    useEffect(() => {
        const fetchMedia = async () => {
            if (isFetching.current) return;

            isFetching.current = true;
            setLoading(true);

            try {
                // Load first 3 pages to get ~60 messages (since page size is now 20)
                // This ensures we have good coverage for finding images
                const promises = [
                    chatApi.getMessages(conversationId, 1),
                    chatApi.getMessages(conversationId, 2),
                    chatApi.getMessages(conversationId, 3)
                ];

                const results = await Promise.all(promises);

                // Combine all messages and filter for images
                const allMessages = results.flatMap(r => r.messages);
                const mediaMessages = allMessages.filter(m => m.type === 'image');

                setMessages(mediaMessages);
                // Check if there are more pages after page 3
                setHasMore(results[2].hasMore);
                setPage(3); // Start from page 3 for subsequent infinite scroll loads

            } catch (error) {
                console.error("Error loading media:", error);
            } finally {
                setLoading(false);
                isFetching.current = false;
            }
        };

        fetchMedia();
    }, [conversationId]); // Only depends on conversationId, not page

    // Infinite scroll - load additional pages when needed
    useEffect(() => {
        if (page <= 3) return; // Skip for initial 3 pages (already loaded above)

        const fetchMoreMedia = async () => {
            if (isFetching.current) return;
            if (!hasMore) return;

            isFetching.current = true;

            try {
                const res = await chatApi.getMessages(conversationId, page);

                // Filter for images
                const mediaMessages = res.messages.filter(m => m.type === 'image');

                setMessages(prev => [...prev, ...mediaMessages]);
                setHasMore(res.hasMore);

            } catch (error) {
                console.error("Error loading more media:", error);
            } finally {
                isFetching.current = false;
            }
        };

        fetchMoreMedia();
    }, [conversationId, page, hasMore]);

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loading && !isFetching.current) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 0.5 }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => {
            if (observerRef.current) {
                observer.unobserve(observerRef.current);
            }
        };
    }, [hasMore, loading]);

    return (
        <div className="min-h-[200px]">
            {/* Grid Layout */}
            <div className="grid grid-cols-3 gap-2">
                {messages.map((msg) => (
                    <MediaItem
                        key={msg.id}
                        msg={msg}
                        onClick={() => setSelectedMedia({
                            url: msg.fileUrl || "",
                            type: "image",
                            fileName: msg.fileName || undefined
                        })}
                    />
                ))}

                {/* Skeleton Loading State (for API fetching) */}
                {(loading || isFetching.current) && (
                    Array.from({ length: 9 }).map((_, i) => (
                        <Skeleton key={`skeleton-${i}`} className="aspect-square rounded-md w-full h-full" />
                    ))
                )}
            </div>

            {/* Observer Target */}
            <div ref={observerRef} className="h-4 w-full" />

            {!loading && messages.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm col-span-3">
                    Chưa có hình ảnh nào
                </div>
            )}

            <MediaPreview
                open={!!selectedMedia}
                onOpenChange={(open) => !open && setSelectedMedia(null)}
                url={selectedMedia?.url || null}
                type={selectedMedia?.type || "image"}
                fileName={selectedMedia?.fileName}
            />
        </div>
    );
};
