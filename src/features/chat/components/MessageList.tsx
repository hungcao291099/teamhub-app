import React, { useEffect, useRef, useState } from "react";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, ChevronDown, AlertTriangle, Smile, Reply, Trash2 } from "lucide-react";
import { EmojiPicker } from "./EmojiPicker";
import { Button } from "@/components/ui/button";
import { getImageUrl, cn } from "@/lib/utils";
import { MediaPreview } from "./MediaPreview";

// Message list component
interface MessageListProps {
    onReply?: (message: any) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ onReply }) => {
    const { messages, isLoading, loadMoreMessages, addReaction, removeReaction, deleteMessage, activeConversationId, typingUsers } = useChat();
    const { currentUser } = useAuth();
    const scrollRef = useRef<HTMLDivElement>(null);
    const prevScrollHeightRef = useRef(0);
    const shouldScrollToBottomRef = useRef(true); // Default to true for initial load
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<{
        url: string;
        type: "image" | "video";
        fileName?: string;
    } | null>(null);

    // Scroll to bottom helper
    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth"
            });
            setShowScrollButton(false);
        }
    };

    // When conversation changes, mark that we should scroll to bottom
    // We don't scroll here immediately because messages might not be loaded yet
    useEffect(() => {
        shouldScrollToBottomRef.current = true;
        prevScrollHeightRef.current = 0; // Reset tracking
        setShowScrollButton(false);
    }, [activeConversationId]);

    // Scroll handling for messages
    useEffect(() => {
        if (scrollRef.current) { // Removed !isLoading check to allow scrolling even if briefly loading
            // Use setTimeout to allow DOM to update height properly
            setTimeout(() => {
                if (!scrollRef.current) return;

                const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;

                // 1. Force scroll to bottom if explicit flag is set (e.g. changed conversation)
                if (shouldScrollToBottomRef.current) {
                    scrollRef.current.scrollTop = scrollHeight;
                    shouldScrollToBottomRef.current = false;
                    prevScrollHeightRef.current = scrollHeight;
                    setShowScrollButton(false);
                    return;
                }

                // 2. Logic for incoming messages (live chat)
                const isFirstLoad = prevScrollHeightRef.current === 0;
                // Check if user is near bottom (within 200px)
                const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;

                // If it's first load OR user is near bottom, scroll to bottom
                if (isFirstLoad || isNearBottom) {
                    scrollRef.current.scrollTop = scrollHeight;
                    setShowScrollButton(false);
                } else {
                    // Update button visibility if we didn't scroll to bottom
                    const isDistanceFromBottom = scrollHeight - scrollTop - clientHeight > 300;
                    setShowScrollButton(isDistanceFromBottom);
                }

                prevScrollHeightRef.current = scrollHeight;
            }, 100);
        }
    }, [messages, isLoading, activeConversationId, typingUsers]); // Added typingUsers to auto-scroll when typing appears

    const handleScroll = () => {
        if (!scrollRef.current) return;

        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

        // Show scroll button if we are more than 300px from bottom
        const isDistanceFromBottom = scrollHeight - scrollTop - clientHeight > 300;
        setShowScrollButton(isDistanceFromBottom);

        if (scrollTop === 0 && !isLoading) {
            loadMoreMessages();
        }
    };

    const handleReaction = async (messageId: number, emoji: string, hasReacted: boolean, myReaction?: any) => {
        if (hasReacted && myReaction) {
            await removeReaction(messageId, emoji);
        } else {
            await addReaction(messageId, emoji);
        }
    };

    const handleDelete = (messageId: number) => {
        setMessageToDelete(messageId);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!messageToDelete) return;
        setIsDeleting(true);
        try {
            await deleteMessage(messageToDelete);
        } catch (error) {
            console.error("Error deleting message:", error);
        } finally {
            setIsDeleting(false);
            setMessageToDelete(null);
            setDeleteDialogOpen(false);
        }
    };

    const renderMessage = (message: any, index: number) => {
        const isOwn = message.senderId === currentUser?.id;
        const prevMessage = messages[index - 1];

        // Determine if we should show header (Avatar + Name + Time)
        // Show if: first message, different sender than prev, or time gap > 5 min
        const isSameSender = prevMessage && prevMessage.senderId === message.senderId;
        const timeDiff = prevMessage ? (new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()) / 1000 : 0;
        const showHeader = !isSameSender || timeDiff > 300; // 5 mins

        // Detect URLs in content
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const contentParts = message.content.split(urlRegex);

        // Group reactions by emoji
        const groupedReactions = message.reactions?.reduce((acc: any, r: any) => {
            if (!acc[r.emoji]) acc[r.emoji] = [];
            acc[r.emoji].push(r);
            return acc;
        }, {});

        return (
            <div
                key={message.id}
                className={cn(
                    "group flex pr-4 pl-4 py-0.5 hover:bg-black/5 dark:hover:bg-white/5 relative",
                    showHeader ? "mt-4" : "mt-0.5"
                )}
            >
                {/* Left Column: Avatar or Timestamp on hover (Discord style) */}
                <div className="w-[50px] shrink-0 pt-0.5 select-none text-right pr-3">
                    {showHeader ? (
                        <Avatar className="h-10 w-10 cursor-pointer hover:drop-shadow-md transition-all active:scale-95">
                            <AvatarImage src={getImageUrl(message.senderAvatarUrl) || undefined} alt={message.senderName} />
                            <AvatarFallback>{message.senderName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                    ) : (
                        <span className="text-[10px] text-muted-foreground hidden group-hover:inline-block align-top mt-1">
                            {/* Valid timestamp for consecutive messages? Usually empty or condensed time */}
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </span>
                    )}
                </div>

                {/* Right Column: Content */}
                <div className="flex-1 min-w-0">
                    {showHeader && (
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-base cursor-pointer hover:underline text-foreground">
                                {message.senderName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: vi })}
                                {message.isEdited && " (đã chỉnh sửa)"}
                            </span>
                        </div>
                    )}

                    <div className="relative">
                        {/* Message Content Container - No Bubble */}
                        <div className={cn(
                            "text-[0.95rem] leading-relaxed text-foreground/90 whitespace-pre-wrap break-words",
                            message.isDeleted ? "italic text-muted-foreground" : ""
                        )}>
                            {message.replyTo && (
                                <div className="flex items-center gap-2 mb-1 opacity-75 text-xs">
                                    <div className="w-8 border-t-2 border-l-2 border-muted-foreground/30 h-3 rounded-tl-md" />
                                    <span className="font-semibold">@{message.replyTo.senderName}</span>
                                    <span className="text-muted-foreground truncate max-w-[200px]">{message.replyTo.content}</span>
                                </div>
                            )}

                            {/* Only show content if not deleted */}
                            {!message.isDeleted ? (
                                message.type === "image" && message.fileUrl ? (
                                    <img
                                        src={message.fileUrl}
                                        alt={message.fileName || "Image"}
                                        className="max-w-[300px] md:max-w-[400px] max-h-[350px] object-cover rounded-lg cursor-pointer my-1 shadow-sm border"
                                        onClick={() => setSelectedMedia({
                                            url: message.fileUrl!,
                                            type: "image",
                                            fileName: message.fileName || undefined
                                        })}
                                    />
                                ) : message.type === "file" && message.fileUrl ? (
                                    /\.(mp4|webm|ogg|mov)$/i.test(message.fileName || "") ? (
                                        <div
                                            className="cursor-pointer max-w-[400px] mt-1"
                                            onClick={() => setSelectedMedia({
                                                url: message.fileUrl!,
                                                type: "video",
                                                fileName: message.fileName || undefined
                                            })}
                                        >
                                            <video src={message.fileUrl} className="w-full rounded-lg max-h-[300px]" controls={false} />
                                        </div>
                                    ) : (
                                        <a
                                            href={message.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-secondary/50 rounded-md border mt-1 max-w-sm hover:bg-secondary/80 transition-colors group/file"
                                        >
                                            <div className="bg-primary/10 p-2 rounded text-primary group-hover/file:text-primary/80">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate text-blue-500 hover:underline">{message.fileName}</div>
                                                <div className="text-xs text-muted-foreground">Attachment</div>
                                            </div>
                                        </a>
                                    )
                                ) : (
                                    <span className="">
                                        {contentParts.map((part: string, i: number) =>
                                            urlRegex.test(part) ? (
                                                <a
                                                    key={i}
                                                    href={part}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 hover:underline"
                                                >
                                                    {part}
                                                </a>
                                            ) : (
                                                <span key={i}>{part}</span>
                                            )
                                        )}
                                    </span>
                                )
                            ) : (
                                <span>Tin nhắn đã bị xóa</span>
                            )}
                        </div>

                        {/* Reactions */}
                        {groupedReactions && Object.keys(groupedReactions).length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-1">
                                {Object.entries(groupedReactions).map(([emoji, reactions]: [string, any]) => {
                                    const hasMyReaction = reactions.some((r: any) => r.userId === currentUser?.id);
                                    const myRxn = reactions.find((r: any) => r.userId === currentUser?.id);
                                    return (
                                        <button
                                            key={emoji}
                                            onClick={() => handleReaction(message.id, emoji, hasMyReaction, myRxn)}
                                            className={cn(
                                                "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md border transition-all",
                                                hasMyReaction
                                                    ? "bg-blue-500/10 border-blue-500/50"
                                                    : "bg-secondary/40 border-transparent hover:border-border"
                                            )}
                                        >
                                            <span className="scale-90">{emoji}</span>
                                            <span className={cn("font-medium", hasMyReaction ? "text-blue-500" : "text-muted-foreground")}>
                                                {reactions.length}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Floating Context Menu (Discord style: Top right of message) */}
                {!message.isDeleted && (
                    <div className="absolute -top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm rounded-lg p-0.5 flex items-center z-10">
                        {/* Reaction Button */}
                        <EmojiPicker onSelect={(emoji) => addReaction(message.id, emoji)}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/50 rounded" title="Thêm reaction">
                                <Smile className="h-4 w-4" />
                            </Button>
                        </EmojiPicker>

                        {/* Reply Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-accent/50 rounded"
                            onClick={() => onReply?.(message)}
                            title="Trả lời"
                        >
                            <Reply className="h-4 w-4" />
                        </Button>

                        {/* Delete Button - Only for own messages */}
                        {isOwn && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive rounded"
                                onClick={() => handleDelete(message.id)}
                                title="Xóa tin nhắn"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="relative flex-1 overflow-hidden flex flex-col min-h-0">
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4"
            >
                {isLoading && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {messages.length === 0 && !isLoading ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>Chưa có tin nhắn nào</p>
                    </div>
                ) : (
                    messages.map((message, index) => renderMessage(message, index))
                )}

                {/* Typing Indicator */}
                {activeConversationId && typingUsers.get(activeConversationId) && typingUsers.get(activeConversationId)!.length > 0 && (
                    <div className="flex gap-2 mb-4 group">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs animate-pulse">...</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start max-w-[70%]">
                            <div className="bg-accent text-accent-foreground rounded-lg px-4 py-2 flex items-center gap-1">
                                <span className="text-sm text-muted-foreground mr-1">
                                    {typingUsers.get(activeConversationId)!.join(", ")} đang gõ
                                </span>
                                <span className="flex gap-0.5">
                                    <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce"></span>
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showScrollButton && (
                <Button
                    size="icon"
                    variant="default"
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 h-10 w-10"
                    onClick={scrollToBottom}
                >
                    <ChevronDown className="h-6 w-6" />
                </Button>
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Xóa tin nhắn
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa tin nhắn này? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDelete();
                            }}
                            disabled={isDeleting}
                            variant="destructive"
                        >
                            {isDeleting ? "Đang xóa..." : "Xóa"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
