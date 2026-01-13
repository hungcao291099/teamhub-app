import React, { useEffect, useRef, useState } from "react";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageList } from "./MessageList";
import { GroupInfoDialog } from "./GroupInfoDialog";
import { ArrowLeft, Image, Send, Loader2, X, Info, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatWindowProps {
    onBack?: () => void;
    hideHeader?: boolean;
    onToggleInfo?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onBack, hideHeader, onToggleInfo }) => {
    const {
        conversations,
        activeConversationId,
        messages,
        sendMessage,
        uploadFile,
        startTyping,
        stopTyping,
        markAsRead,
        isChatDialogOpen
    } = useChat();
    const { currentUser, onlineUsers } = useAuth();

    const [input, setInput] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [replyTo, setReplyTo] = useState<any>(null);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [groupInfoOpen, setGroupInfoOpen] = useState(false);
    // Pending pasted images (not yet sent)
    const [pendingImages, setPendingImages] = useState<{ file: File; preview: string }[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const stopTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Track last marked message to prevent duplicate markAsRead calls
    const lastMarkedMessageRef = useRef<{ conversationId: number; messageId: number } | null>(null);
    const markAsReadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    // Reset last marked ref when conversation changes
    useEffect(() => {
        lastMarkedMessageRef.current = null;
    }, [activeConversationId]);

    useEffect(() => {
        // Mark messages as read when:
        // 1. Dialog is open
        // 2. Conversation is selected
        // 3. There are messages
        if (isChatDialogOpen && activeConversationId && messages.length > 0 && currentUser) {
            // Find messages from OTHER users (not from current user)
            const otherUserMessages = messages.filter(m => m.senderId !== currentUser.id);

            if (otherUserMessages.length === 0) return;

            // Find the message with the HIGHEST ID (newest) from other users
            // Don't use reverse().find() as array order might be inconsistent due to real-time updates
            const lastOtherUserMessage = otherUserMessages.reduce((max, msg) =>
                msg.id > max.id ? msg : max
                , otherUserMessages[0]);

            console.log('[ChatWindow] Highest other user message ID:', lastOtherUserMessage.id);

            if (lastOtherUserMessage) {
                // Only call markAsRead if we haven't already marked this specific message
                const alreadyMarked = lastMarkedMessageRef.current?.conversationId === activeConversationId
                    && lastMarkedMessageRef.current?.messageId === lastOtherUserMessage.id;

                if (!alreadyMarked) {
                    // Debounce the markAsRead call
                    if (markAsReadTimeoutRef.current) {
                        clearTimeout(markAsReadTimeoutRef.current);
                    }

                    markAsReadTimeoutRef.current = setTimeout(() => {
                        console.log('[ChatWindow] Marking as read:', activeConversationId, lastOtherUserMessage.id);
                        markAsRead(activeConversationId, lastOtherUserMessage.id);
                        lastMarkedMessageRef.current = {
                            conversationId: activeConversationId,
                            messageId: lastOtherUserMessage.id
                        };
                    }, 100); // Fast response
                }
            }
        }

        return () => {
            if (markAsReadTimeoutRef.current) {
                clearTimeout(markAsReadTimeoutRef.current);
            }
        };
    }, [isChatDialogOpen, activeConversationId, messages, markAsRead, currentUser]);

    const handleSend = async () => {
        const hasText = input.trim().length > 0;
        const hasImages = pendingImages.length > 0;

        if ((!hasText && !hasImages) || isSending) return;

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
                // Revoke the blob URL
                URL.revokeObjectURL(img.preview);
            }
            setPendingImages([]);

            // Then send text message if any
            if (hasText) {
                await sendMessage(
                    input.trim(),
                    "text",
                    undefined,
                    undefined,
                    replyTo?.id
                );
            }

            setReplyTo(null);
            setInput("");
            stopTyping(activeConversationId!);
            if (textareaRef.current) {
                textareaRef.current.style.height = "auto";
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsSending(false);
            textareaRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        } else if (e.key === "Escape") {
            // Cancel reply
            setReplyTo(null);
            setInput("");
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);

        // Auto resize
        e.target.style.height = "auto";
        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;

        // Handling typing indicators
        if (activeConversationId) {
            if (e.target.value.trim()) {
                // 1. Notify we are typing immediately (ChatContext handles throttling)
                startTyping(activeConversationId);

                // 2. Schedule stop typing if user stops for 1000ms
                if (stopTypingTimeoutRef.current) {
                    clearTimeout(stopTypingTimeoutRef.current);
                }

                stopTypingTimeoutRef.current = setTimeout(() => {
                    // Logic handled in ChatContext mostly, but good to be explicit
                    // Actually, ChatContext auto-stops after 3s, but let's leave it to that
                    // or we can call stopTyping explicitly here if we want more aggressive "stop"
                    // when user pauses.
                    // Let's rely on ChatContext's auto-stop for simplicity, 
                    // OR call stopTyping here if we want to be precise about "user paused".
                    // The original requirement was lag fix involving debounce mismatch.
                    // By removing the 300ms start delay, we improved responsiveness.
                    // We can also just do nothing here and let the context timeout handle 'stop'.
                }, 1000);

            } else {
                // If input became empty, stop immediately
                if (stopTypingTimeoutRef.current) {
                    clearTimeout(stopTypingTimeoutRef.current);
                }
                stopTyping(activeConversationId);
            }
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setAlertMessage("Kích thước ảnh phải nhỏ hơn 5MB");
            setAlertOpen(true);
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
                    setAlertMessage("Kích thước ảnh phải nhỏ hơn 5MB");
                    setAlertOpen(true);
                    continue;
                }

                // Create preview URL and add to pending list
                const preview = URL.createObjectURL(file);
                newImages.push({ file, preview });
            }
        }

        if (newImages.length > 0) {
            setPendingImages(prev => [...prev, ...newImages]);
        }
    };

    // Remove a pending image
    const removePendingImage = (index: number) => {
        setPendingImages(prev => {
            const newImages = [...prev];
            // Revoke the blob URL to free memory
            URL.revokeObjectURL(newImages[index].preview);
            newImages.splice(index, 1);
            return newImages;
        });
    };

    // Cleanup blob URLs on unmount
    useEffect(() => {
        return () => {
            pendingImages.forEach(img => URL.revokeObjectURL(img.preview));
        };
    }, []);

    const handleReply = (message: any) => {
        setReplyTo(message);
        textareaRef.current?.focus();
    };

    const cancelReply = () => {
        setReplyTo(null);
    };

    if (!activeConversation) return null;

    const displayName = activeConversation.type === "group"
        ? activeConversation.name
        : (activeConversation.participants[0]?.name || activeConversation.participants[0]?.username || "Unknown");

    const avatarUrl = activeConversation.type === "group"
        ? null // Add group avatar logic here if needed
        : activeConversation.participants[0]?.avatarUrl;

    const isOnline = activeConversation.type === "direct" && activeConversation.participants[0]
        ? onlineUsers.includes(activeConversation.participants[0].id)
        : false;

    return (
        <div className="flex flex-col h-full min-h-0 overflow-hidden bg-background">
            {/* Header */}
            {!hideHeader && (
                <div className="h-14 px-4 border-b flex items-center justify-between shrink-0 bg-background shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        {onBack && (
                            <Button size="icon" variant="ghost" onClick={onBack}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        )}
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                {/* Only show avatar in header if NOT group? Or always? Discord shows '#' icon for text channels usually. */}
                                <div className="h-8 w-8 flex items-center justify-center text-2xl text-muted-foreground font-bold">
                                    {activeConversation.type === 'group' ? (
                                        <span className="text-xl">#</span>
                                    ) : (
                                        <div className="relative">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={getImageUrl(avatarUrl) || undefined} />
                                                <AvatarFallback>{displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-semibold flex items-center gap-2">
                                    {displayName}
                                    {/* {isOnline && <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />} */}
                                </h3>
                                {/* Topic or status? */}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Search? Pinned? */}
                        <Button size="icon" variant="ghost" className="opacity-70 hover:opacity-100" onClick={onToggleInfo ? onToggleInfo : () => setGroupInfoOpen(true)}>
                            {activeConversation.type === 'group' ? <Users className="h-5 w-5" /> : <Info className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            )}

            {/* Messages */}
            <MessageList onReply={handleReply} />

            {/* Input */}
            <div className="p-4 border-t">
                {/* Reply Preview */}
                {replyTo && (
                    <div className="mb-2 p-2 bg-accent rounded flex items-start justify-between">
                        <div className="flex-1">
                            <div className="text-xs font-semibold text-blue-600">
                                Trả lời {replyTo.senderName}
                            </div>
                            <div className="text-sm truncate text-muted-foreground">
                                {replyTo.content}
                            </div>
                        </div>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={cancelReply}
                        >
                            <X className="h-4 w-4" />
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
                                    className="h-16 w-16 object-cover rounded border"
                                />
                                <button
                                    onClick={() => removePendingImage(index)}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Xóa ảnh"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-end gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*,.pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleImageUpload}
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Image className="h-5 w-5" />}
                    </Button>

                    <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        placeholder="Nhập tin nhắn..."
                        className="resize-none min-h-[40px] max-h-[120px]"
                        rows={1}
                    />

                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={(!input.trim() && pendingImages.length === 0) || isSending}
                    >
                        {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Thông báo</AlertDialogTitle>
                        <AlertDialogDescription>
                            {alertMessage}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setAlertOpen(false)}>Đóng</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Chat Info Dialog */}
            <GroupInfoDialog
                conversationId={activeConversationId!}
                currentConversation={activeConversation}
                open={groupInfoOpen}
                onOpenChange={setGroupInfoOpen}
                onGroupDeleted={() => {
                    setGroupInfoOpen(false);
                }}
            />
        </div>
    );
};
