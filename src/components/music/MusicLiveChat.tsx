import React, { useEffect, useRef, useState, useCallback } from "react";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/hooks/useAuth";
import { chatApi } from "@/services/chatApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarWithFrame } from "@/components/ui/avatar-with-frame";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageCircle, Users, Loader2, Image, X, Reply, Trash2, Smile } from "lucide-react";
import { getImageUrl, cn } from "@/lib/utils";
import { Message } from "@/services/chatApi";
import { EmojiPicker } from "@/features/chat/components/EmojiPicker";
import { MediaPreview } from "@/features/chat/components/MediaPreview";
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

interface MusicLiveChatProps {
    className?: string;
}

export const MusicLiveChat: React.FC<MusicLiveChatProps> = ({ className }) => {
    const { currentUser, onlineUsers } = useAuth();
    const {
        sendMessage,
        messages,
        setActiveConversation,
        markAsRead,
        addReaction,
        deleteMessage,
        uploadFile
    } = useChat();

    const [musicChatId, setMusicChatId] = useState<number | null>(null);
    const [participantCount, setParticipantCount] = useState(0);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [pendingImages, setPendingImages] = useState<{ file: File; preview: string }[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState<{
        url: string;
        type: "image" | "video";
        fileName?: string;
    } | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize Music Chat
    useEffect(() => {
        const initMusicChat = async () => {
            try {
                setIsLoading(true);
                const data = await chatApi.getMusicChat();
                setMusicChatId(data.conversationId);
                setParticipantCount(data.participantCount);
                setActiveConversation(data.conversationId);
            } catch (error) {
                console.error("Error initializing music chat:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initMusicChat();

        return () => {
            // Don't clear active conversation on unmount as it might affect other components
        };
    }, [setActiveConversation]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Mark as read when messages change
    useEffect(() => {
        if (musicChatId && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.senderId !== currentUser?.id) {
                markAsRead(musicChatId, lastMessage.id);
            }
        }
    }, [musicChatId, messages, currentUser?.id, markAsRead]);

    // Cleanup blob URLs on unmount
    useEffect(() => {
        return () => {
            pendingImages.forEach(img => URL.revokeObjectURL(img.preview));
        };
    }, []);

    const handleSend = useCallback(async () => {
        const hasText = inputValue.trim().length > 0;
        const hasImages = pendingImages.length > 0;

        if ((!hasText && !hasImages) || !musicChatId || isSending) return;

        setIsSending(true);
        try {
            // First, send any pending images
            for (const img of pendingImages) {
                try {
                    const { fileUrl, fileName } = await uploadFile(img.file);
                    await sendMessage(fileName, "image", fileUrl, fileName, replyTo?.id);
                } catch (error) {
                    console.error("Error uploading pending image:", error);
                }
                URL.revokeObjectURL(img.preview);
            }
            setPendingImages([]);

            // Then send text message if any
            if (hasText) {
                await sendMessage(inputValue.trim(), "text", undefined, undefined, replyTo?.id);
            }

            setReplyTo(null);
            setInputValue("");
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsSending(false);
            textareaRef.current?.focus();
        }
    }, [inputValue, musicChatId, isSending, sendMessage, pendingImages, uploadFile, replyTo]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        } else if (e.key === "Escape") {
            setReplyTo(null);
            setInputValue("");
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
        // Auto resize
        e.target.style.height = "auto";
        e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("Kích thước ảnh phải nhỏ hơn 5MB");
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        setIsUploading(true);
        try {
            const { fileUrl, fileName } = await uploadFile(file);
            const isImage = file.type.startsWith("image/");
            await sendMessage(fileName, isImage ? "image" : "file", fileUrl, fileName, replyTo?.id);
            setReplyTo(null);
        } catch (error) {
            console.error("Error uploading file:", error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        const newImages: { file: File; preview: string }[] = [];

        for (const item of items) {
            if (item.type.startsWith("image/")) {
                e.preventDefault();
                const file = item.getAsFile();
                if (!file) continue;

                if (file.size > 5 * 1024 * 1024) {
                    alert("Kích thước ảnh phải nhỏ hơn 5MB");
                    continue;
                }

                const preview = URL.createObjectURL(file);
                newImages.push({ file, preview });
            }
        }

        if (newImages.length > 0) {
            setPendingImages(prev => [...prev, ...newImages]);
        }
    };

    const removePendingImage = (index: number) => {
        setPendingImages(prev => {
            const newImages = [...prev];
            URL.revokeObjectURL(newImages[index].preview);
            newImages.splice(index, 1);
            return newImages;
        });
    };

    const handleReply = (message: Message) => {
        setReplyTo(message);
        textareaRef.current?.focus();
    };

    const cancelReply = () => {
        setReplyTo(null);
    };

    const handleReaction = async (messageId: number, emoji: string, _hasReacted: boolean, _myReaction?: any) => {
        // Always add reaction (increment only, no cancellation)
        await addReaction(messageId, emoji);
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

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    };

    if (isLoading) {
        return (
            <div className={cn("flex flex-col h-full bg-card border-l border-border", className)}>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col h-full bg-card border-l border-border", className)}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-sm">Live Chat</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span>{participantCount}</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-2" ref={scrollRef}>
                <div className="space-y-1">
                    {messages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>Chưa có tin nhắn</p>
                            <p className="text-xs mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <MessageItem
                                key={msg.id}
                                message={msg}
                                isOwn={msg.senderId === currentUser?.id}
                                isOnline={onlineUsers.includes(msg.senderId)}
                                currentUserId={currentUser?.id}
                                formatTime={formatTime}
                                onReply={handleReply}
                                onReaction={handleReaction}
                                onDelete={handleDelete}
                                onMediaClick={setSelectedMedia}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-muted/20">
                {/* Reply Preview */}
                {replyTo && (
                    <div className="mb-2 p-2 bg-accent rounded flex items-start justify-between text-xs">
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-blue-600">
                                Trả lời {replyTo.senderName}
                            </div>
                            <div className="truncate text-muted-foreground">
                                {replyTo.content}
                            </div>
                        </div>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5"
                            onClick={cancelReply}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                )}

                {/* Pending Images Preview */}
                {pendingImages.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                        {pendingImages.map((img, index) => (
                            <div key={index} className="relative group">
                                <img
                                    src={img.preview}
                                    alt={`Pending ${index + 1}`}
                                    className="h-12 w-12 object-cover rounded border"
                                />
                                <button
                                    onClick={() => removePendingImage(index)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Xóa ảnh"
                                >
                                    <X className="h-2.5 w-2.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-end gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
                    </Button>

                    <Textarea
                        ref={textareaRef}
                        placeholder="Nhắn gì đó..."
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        disabled={isSending}
                        className="flex-1 min-h-[36px] max-h-[100px] text-sm resize-none py-2"
                        rows={1}
                    />

                    <Button
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={handleSend}
                        disabled={(!inputValue.trim() && pendingImages.length === 0) || isSending}
                    >
                        {isSending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa tin nhắn</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa tin nhắn này?
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
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Đang xóa..." : "Xóa"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Media Preview */}
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

interface MessageItemProps {
    message: Message;
    isOwn: boolean;
    isOnline: boolean;
    currentUserId?: number;
    formatTime: (date: string) => string;
    onReply: (message: Message) => void;
    onReaction: (messageId: number, emoji: string, hasReacted: boolean, myReaction?: any) => void;
    onDelete: (messageId: number) => void;
    onMediaClick: (media: { url: string; type: "image" | "video"; fileName?: string }) => void;
}

// Discord-style flat message layout with full features
const MessageItem: React.FC<MessageItemProps> = ({
    message,
    isOwn,
    isOnline,
    currentUserId,
    formatTime,
    onReply,
    onReaction,
    onDelete,
    onMediaClick
}) => {
    if (message.isDeleted) {
        return (
            <div className="text-xs text-muted-foreground italic py-1 pl-9">
                Tin nhắn đã bị xóa
            </div>
        );
    }

    // Group reactions by emoji
    const groupedReactions = message.reactions?.reduce((acc: any, r: any) => {
        if (!acc[r.emoji]) acc[r.emoji] = [];
        acc[r.emoji].push(r);
        return acc;
    }, {});

    // Detect URLs in content
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const contentParts = message.content?.split(urlRegex) || [];

    return (
        <div className="flex gap-2 py-1 hover:bg-muted/30 px-2 -mx-2 rounded group relative">
            <div className="shrink-0 self-start">
                <div className="relative inline-block">
                    <AvatarWithFrame frameId={(message as any).senderSelectedFrame} size="xs">
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={getImageUrl(message.senderAvatarUrl) || undefined} />
                            <AvatarFallback className="text-xs bg-primary/20 text-primary">
                                {message.senderName?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </AvatarWithFrame>
                    {isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                    )}
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                    <span className={cn(
                        "text-sm font-semibold",
                        isOwn ? "text-primary" : "text-foreground"
                    )}>
                        {message.senderName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                        {formatTime(message.createdAt)}
                    </span>
                </div>

                {/* Reply reference */}
                {message.replyTo && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                        <Reply className="w-3 h-3" />
                        <span className="font-medium">@{message.replyTo.senderName}</span>
                        <span className="truncate max-w-[150px]">{message.replyTo.content}</span>
                    </div>
                )}

                {/* Content */}
                {message.type === "image" && message.fileUrl ? (
                    <img
                        src={message.fileUrl}
                        alt={message.fileName || "Image"}
                        className="max-w-[200px] max-h-[150px] object-cover rounded cursor-pointer my-1 border"
                        onClick={() => onMediaClick({
                            url: message.fileUrl!,
                            type: "image",
                            fileName: message.fileName || undefined
                        })}
                    />
                ) : message.type === "file" && message.fileUrl ? (
                    <a
                        href={message.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                    >
                        📎 {message.fileName}
                    </a>
                ) : (
                    <p className="text-sm text-foreground/90 break-words">
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
                    </p>
                )}

                {/* Reactions */}
                {groupedReactions && Object.keys(groupedReactions).length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1">
                        {Object.entries(groupedReactions).map(([emoji, reactions]: [string, any]) => {
                            const hasMyReaction = reactions.some((r: any) => r.userId === currentUserId);
                            const myRxn = reactions.find((r: any) => r.userId === currentUserId);
                            return (
                                <button
                                    key={emoji}
                                    onClick={() => onReaction(message.id, emoji, hasMyReaction, myRxn)}
                                    className={cn(
                                        "flex items-center gap-0.5 text-xs px-1 py-0.5 rounded border transition-all",
                                        hasMyReaction
                                            ? "bg-blue-500/10 border-blue-500/50"
                                            : "bg-secondary/40 border-transparent hover:border-border"
                                    )}
                                >
                                    <span className="scale-75">{emoji}</span>
                                    <span className={cn("font-medium text-[10px]", hasMyReaction ? "text-blue-500" : "text-muted-foreground")}>
                                        {reactions.length}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Floating action buttons */}
            <div className="absolute -top-2 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background border shadow-sm rounded p-0.5 flex items-center z-10">
                <EmojiPicker onSelect={(emoji) => onReaction(message.id, emoji, false, undefined)}>
                    <Button variant="ghost" size="icon" className="h-6 w-6" title="Thêm reaction">
                        <Smile className="h-3 w-3" />
                    </Button>
                </EmojiPicker>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onReply(message)}
                    title="Trả lời"
                >
                    <Reply className="h-3 w-3" />
                </Button>
                {isOwn && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:text-destructive"
                        onClick={() => onDelete(message.id)}
                        title="Xóa"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                )}
            </div>
        </div>
    );
};

export default MusicLiveChat;
