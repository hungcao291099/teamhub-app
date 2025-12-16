import React, { useEffect, useRef, useState } from "react";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Loader2, MoreVertical, ChevronDown } from "lucide-react";
import { MessageContextMenu } from "./MessageContextMenu";
import { EmojiPicker } from "./EmojiPicker";
import { DeleteMessageDialog } from "./DeleteMessageDialog";
import { Button } from "@/components/ui/button";

// Message list component
interface MessageListProps {
    onReply?: (message: any) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ onReply }) => {
    const { messages, isLoading, loadMoreMessages, addReaction, removeReaction, deleteMessage, activeConversationId } = useChat();
    const { currentUser } = useAuth();
    const scrollRef = useRef<HTMLDivElement>(null);
    const prevScrollHeightRef = useRef(0);
    const shouldScrollToBottomRef = useRef(true); // Default to true for initial load
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);

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
    }, [messages, isLoading, activeConversationId]); // Added activeConversationId to deps to be safe

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
        }
    };

    const renderMessage = (message: any, index: number) => {
        const isOwn = message.senderId === currentUser?.id;
        const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;

        // Calculate time difference with previous message for dynamic spacing (WhatsApp style)
        let messageGapClass = "mb-1"; // Very tight spacing for consecutive messages
        if (index > 0) {
            const currentMessageTime = new Date(message.createdAt).getTime();
            const previousMessageTime = new Date(messages[index - 1].createdAt).getTime();
            const timeDiffInSeconds = (currentMessageTime - previousMessageTime) / 1000;
            const sameSender = messages[index - 1].senderId === message.senderId;

            // WhatsApp-style spacing:
            // - Same sender, within 1 min: very tight (mb-1)
            // - Different sender, within 1 min: small gap (mb-3)
            // - More than 1 min apart: larger gap (mb-6)
            if (timeDiffInSeconds > 60) {
                messageGapClass = "mb-6";
            } else if (!sameSender) {
                messageGapClass = "mb-3";
            }
        } else {
            // First message always has larger gap
            messageGapClass = "mb-6";
        }

        // Determine if timestamp should be shown (WhatsApp style)
        // Show timestamp only if:
        // 1. This is the last message in the list, OR
        // 2. Next message is from a different sender, OR
        // 3. Next message is more than 60 seconds later
        let showTimestamp = true;
        if (index < messages.length - 1) {
            const nextMessage = messages[index + 1];
            const nextMessageTime = new Date(nextMessage.createdAt).getTime();
            const currentMessageTime = new Date(message.createdAt).getTime();
            const timeDiffToNext = (nextMessageTime - currentMessageTime) / 1000;
            const sameSenderWithNext = nextMessage.senderId === message.senderId;

            // Hide timestamp if next message is from same sender within 60 seconds
            if (sameSenderWithNext && timeDiffToNext <= 60) {
                showTimestamp = false;
            }
        }

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
                className={`flex gap-2 ${messageGapClass} group ${isOwn ? "flex-row-reverse" : ""}`}
            >
                {!isOwn && (
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                            {message.senderName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                )}

                <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
                    {!isOwn && showAvatar && (
                        <span className="text-xs text-muted-foreground mb-1">{message.senderName}</span>
                    )}

                    <div className={`relative flex items-center gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                        <div
                            className={`${message.type === "image" ? "p-0 bg-transparent overflow-hidden" : "rounded-lg px-4 py-2"} ${message.type !== "image"
                                ? (isOwn ? "bg-blue-600 text-white" : "bg-accent text-accent-foreground")
                                : ""
                                } ${message.isDeleted ? "italic opacity-70" : ""}`}
                        >
                            {message.replyTo && (
                                <div className={`text-xs opacity-75 border-l-2 pl-2 mb-2 ${message.type === "image" ? "bg-accent/50 p-2 rounded mb-1" : ""}`}>
                                    <div className="font-semibold">{message.replyTo.senderName}</div>
                                    <div className="truncate">{message.replyTo.content}</div>
                                </div>
                            )}

                            {/* Only show content if not deleted */}
                            {!message.isDeleted ? (
                                message.type === "image" && message.fileUrl ? (
                                    <img
                                        src={message.fileUrl}
                                        alt={message.fileName || "Image"}
                                        className="max-w-[280px] max-h-[300px] object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity block"
                                        onClick={() => window.open(message.fileUrl, "_blank")}
                                    />
                                ) : message.type === "file" && message.fileUrl ? (
                                    <a
                                        href={message.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline flex items-center gap-2"
                                    >
                                        📎 {message.fileName}
                                    </a>
                                ) : (
                                    <p className="whitespace-pre-wrap break-words">
                                        {contentParts.map((part: string, i: number) =>
                                            urlRegex.test(part) ? (
                                                <a
                                                    key={i}
                                                    href={part}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="underline hover:opacity-80"
                                                >
                                                    {part}
                                                </a>
                                            ) : (
                                                <span key={i}>{part}</span>
                                            )
                                        )}
                                    </p>
                                )
                            ) : (
                                <p className="whitespace-pre-wrap break-words">
                                    Tin nhắn đã bị xóa
                                </p>
                            )}
                        </div>

                        {/* Reactions - Display as overlay below message */}
                        {groupedReactions && Object.keys(groupedReactions).length > 0 && (
                            <div className={`absolute -bottom-4 ${isOwn ? "right-0" : "left-0"} flex gap-1 flex-wrap z-10`}>
                                {Object.entries(groupedReactions).map(([emoji, reactions]: [string, any]) => {
                                    const hasMyReaction = reactions.some((r: any) => r.userId === currentUser?.id);
                                    const myRxn = reactions.find((r: any) => r.userId === currentUser?.id);
                                    return (
                                        <button
                                            key={emoji}
                                            onClick={() => handleReaction(message.id, emoji, hasMyReaction, myRxn)}
                                            className={`text-sm px-2 py-1 rounded-full transition-colors shadow-md border ${hasMyReaction
                                                ? isOwn
                                                    ? "bg-blue-600/80 text-white border-blue-700" // Own message with my reaction
                                                    : "bg-accent/80 border-accent-foreground/20"   // Other's message with my reaction
                                                : isOwn
                                                    ? "bg-blue-600/60 text-white/90 border-blue-700/50 hover:bg-blue-600/70" // Own message without my reaction
                                                    : "bg-accent/60 border-accent-foreground/10 hover:bg-accent/70"         // Other's message without my reaction
                                                }`}
                                            title={reactions.map((r: any) => r.username).join(", ")}
                                        >
                                            {emoji} {reactions.length > 1 && reactions.length}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        {/* Context Menu inside flex container to sit beside message */}
                        {!message.isDeleted && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex">
                                <EmojiPicker onSelect={(emoji) => addReaction(message.id, emoji)}>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 mr-1">
                                        😀
                                    </Button>
                                </EmojiPicker>
                                <MessageContextMenu
                                    isOwn={isOwn}
                                    onReply={() => onReply?.(message)}
                                    onDelete={() => handleDelete(message.id)}
                                >
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </MessageContextMenu>
                            </div>
                        )}
                    </div>
                    {/* Timestamp inside message container for tighter spacing - only show for last message in sequence */}
                    {showTimestamp && (
                        <span className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: vi })}
                            {message.isEdited && " (đã chỉnh sửa)"}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="relative flex-1 overflow-hidden flex flex-col">
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
            </div>

            {showScrollButton && (
                <Button
                    size="icon"
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 z-50 h-10 w-10"
                    onClick={scrollToBottom}
                >
                    <ChevronDown className="h-6 w-6 text-white" />
                </Button>
            )}

            <DeleteMessageDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={confirmDelete}
                isDeleting={isDeleting}
            />
        </div>
    );
};
