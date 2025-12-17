import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useChat } from "@/context/ChatContext";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";
import { NewConversationDialog } from "./NewConversationDialog";
import { Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ChatDialog: React.FC<ChatDialogProps> = ({ open, onOpenChange }) => {
    const { activeConversationId, setActiveConversation, setChatDialogOpen } = useChat();
    const [showNewConversation, setShowNewConversation] = useState(false);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

    // Track dialog open/close state
    React.useEffect(() => {
        setChatDialogOpen(open);
    }, [open, setChatDialogOpen]);

    React.useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className={`
                    p-0 flex flex-col [&>button]:hidden
                    ${isMobileView
                        ? "w-screen h-screen max-w-none rounded-none border-none"
                        : "max-w-5xl h-[85vh]"
                    }
                `}>
                    <VisuallyHidden>
                        <DialogTitle>Chat Messages</DialogTitle>
                    </VisuallyHidden>
                    <div className="flex h-full min-h-0">
                        {/* Sidebar - Conversation List */}
                        {(!isMobileView || !activeConversationId) && (
                            <div className={`flex flex-col min-h-0 ${isMobileView ? "w-full" : "w-full md:w-80 border-r"}`}>
                                <div className="p-4 border-b flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2">
                                        {isMobileView && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="-ml-2"
                                                onClick={() => onOpenChange(false)}
                                            >
                                                <ArrowLeft className="h-5 w-5" />
                                            </Button>
                                        )}
                                        <h2 className="font-bold text-lg">Tin nhắn</h2>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => setShowNewConversation(true)}
                                        title="Tạo cuộc trò chuyện mới"
                                    >
                                        <Plus className="h-5 w-5" />
                                    </Button>
                                </div>
                                <ConversationList />
                            </div>
                        )}

                        {/* Main Chat Window */}
                        {(!isMobileView || activeConversationId) && (
                            <div className="flex-1 flex flex-col min-h-0">
                                {activeConversationId ? (
                                    <ChatWindow onBack={isMobileView ? () => setActiveConversation(null) : undefined} />
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                        <p>Chọn một cuộc trò chuyện để bắt đầu</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <NewConversationDialog
                open={showNewConversation}
                onOpenChange={setShowNewConversation}
            />
        </>
    );
};
