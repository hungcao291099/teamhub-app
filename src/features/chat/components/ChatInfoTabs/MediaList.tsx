import React, { useState, useEffect, useRef } from "react";
import { chatApi, Message } from "@/services/chatApi";
import { Skeleton } from "@/components/ui/skeleton";

import { MediaPreview } from "../MediaPreview";

interface MediaListProps {
    conversationId: number;
}

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

    // Initial load and page changes
    useEffect(() => {
        const fetchMedia = async () => {
            if (isFetching.current) return;
            if (!hasMore && page !== 1) return;

            isFetching.current = true;
            // Only show main loading spinner on first page
            if (page === 1) setLoading(true);

            try {
                // Determine how to get ONLY media.
                // Currently chatApi doesn't support filtering by type.
                // We will fetch messages and filter client-side for this demo.
                // In production, we should add a `type` filter to the API.
                // WE ARE ASSUMING 'getMessages' returns mixed content.
                // Limitation: Pagination might be sparse if media is rare.
                // For this request, we'll try to fetch enough pages to fill the grid or mock filtering.
                // To adhere to "Lazy load" behavior, we'll just fetch pages and filter.

                const res = await chatApi.getMessages(conversationId, page);

                // Filter for images
                const mediaMessages = res.messages.filter(m => m.type === 'image');

                setMessages(prev => page === 1 ? mediaMessages : [...prev, ...mediaMessages]);
                setHasMore(res.hasMore);

            } catch (error) {
                console.error("Error loading media:", error);
            } finally {
                setLoading(false);
                isFetching.current = false;
            }
        };

        fetchMedia();
    }, [conversationId, page]);

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
                    <div key={msg.id} className="aspect-square relative group overflow-hidden rounded-md bg-muted">
                        {/* We use standard img for simplicity but could use an Image component with blurhash */}
                        <img
                            src={msg.fileUrl || ""}
                            alt="Media"
                            className="object-cover w-full h-full transition-transform hover:scale-105 cursor-pointer"
                            loading="lazy"
                            onClick={() => setSelectedMedia({
                                url: msg.fileUrl || "",
                                type: "image",
                                fileName: msg.fileName || undefined
                            })}
                        />
                    </div>
                ))}

                {/* Skeleton Loading State */}
                {/* Show skeletons if loading first page or fetching more */}
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
