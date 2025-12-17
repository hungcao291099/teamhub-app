import React, { useEffect, useRef, useState } from "react";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageList } from "./MessageList";
import { GroupInfoDialog } from "./GroupInfoDialog";
import { ArrowLeft, Image, Send, Loader2, X, Info } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onBack }) => {
    const {
        conversations,
        activeConversationId,
        messages,
        sendMessage,
        uploadFile,
        startTyping,
        stopTyping,
        markAsRead,
        typingUsers,
        isChatDialogOpen
    } = useChat();
    const { currentUser } = useAuth();

    const [input, setInput] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [replyTo, setReplyTo] = useState<any>(null);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState("");
    const [groupInfoOpen, setGroupInfoOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const typingDebounceRef = useRef<NodeJS.Timeout | null>(null);

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    useEffect(() => {
        // Only mark messages as read when:
        // 1. Dialog is open
        // 2. There are messages  
        // 3. Last message is NOT from current user
        if (isChatDialogOpen && activeConversationId && messages.length > 0 && currentUser) {
            const lastMessage = messages[messages.length - 1];

            // Only mark as read if last message is from someone else
            if (lastMessage.senderId !== currentUser.id) {
                markAsRead(activeConversationId, lastMessage.id);
            }
        }
    }, [isChatDialogOpen, activeConversationId, messages, markAsRead, currentUser]);

    const handleSend = async () => {
        if (!input.trim() || isSending) return;

        setIsSending(true);
        try {
            await sendMessage(
                input.trim(),
                "text",
                undefined,
                undefined,
                replyTo?.id
            );
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

        // Debounced typing indicator
        if (activeConversationId) {
            // Clear previous timeout
            if (typingDebounceRef.current) {
                clearTimeout(typingDebounceRef.current);
            }

            if (e.target.value.trim()) {
                // Debounce typing indicator - only send after 300ms of no typing
                typingDebounceRef.current = setTimeout(() => {
                    startTyping(activeConversationId);
                }, 300);
            } else {
                // Stop typing immediately when input is empty
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

    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
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

                setIsUploading(true);
                try {
                    const { fileUrl, fileName } = await uploadFile(file);
                    await sendMessage(fileName, "image", fileUrl, fileName, replyTo?.id);
                    setReplyTo(null);
                } catch (error) {
                    console.error("Error uploading pasted image:", error);
                } finally {
                    setIsUploading(false);
                }
            }
        }
    };

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
        : activeConversation.participants[0]?.username || "Unknown";

    const typingList = typingUsers.get(activeConversationId!) || [];

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-3">
                {onBack && (
                    <Button size="icon" variant="ghost" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                )}
                <Avatar>
                    <AvatarFallback>{displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h3 className="font-semibold">{displayName}</h3>
                    {typingList.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            {typingList.join(", ")} đang gõ...
                        </p>
                    )}
                </div>
                <Button size="icon" variant="ghost" onClick={() => setGroupInfoOpen(true)}>
                    <Info className="h-5 w-5" />
                </Button>
            </div>

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
                        disabled={!input.trim() || isSending}
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
