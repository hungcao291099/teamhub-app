import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogTitle } from "@radix-ui/react-dialog";
import { ServerSidebar } from "./ServerSidebar";
import { DMSidebar } from "./DMSidebar";
import { InfoSidebar } from "./InfoSidebar";
import { ChatWindow } from "../ChatWindow";
import { useChat } from "@/context/ChatContext";
import { NewConversationDialog } from "../NewConversationDialog";
import { cn } from "@/lib/utils";

interface DiscordLayoutProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const DiscordLayout: React.FC<DiscordLayoutProps> = ({ open, onOpenChange }) => {
    const { activeConversationId, setChatDialogOpen } = useChat();
    const [showInfo, setShowInfo] = useState(false); // Default false, strictly toggle
    const [showNewGroup, setShowNewGroup] = useState(false);

    // Sync dialog state
    React.useEffect(() => {
        setChatDialogOpen(open);
    }, [open, setChatDialogOpen]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={cn(
                "p-0 gap-0 overflow-hidden outline-none duration-200 border-none",
                // Resized modal to max-w-5xl (Large), hide close button
                "w-[95vw] h-[90vh] max-w-5xl bg-background shadow-2xl rounded-xl [&>button]:hidden"
            )}>
                <VisuallyHidden>
                    <DialogTitle>Chat</DialogTitle>
                </VisuallyHidden>

                <div className="flex w-full h-full min-h-0 overflow-hidden bg-background text-foreground">
                    {/* 1. Server/Group Rail (Far Left) */}
                    <ServerSidebar onAddGroup={() => setShowNewGroup(true)} />

                    {/* 2. Main Chat Area (Center) */}
                    <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-background border-r border-l">
                        {activeConversationId ? (
                            <ChatWindow
                                hideHeader={false}
                                onToggleInfo={() => setShowInfo(!showInfo)}
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center flex-col text-muted-foreground gap-4">
                                <div className="p-4 bg-accent/20 rounded-full">
                                    <img src="/logo.png" className="w-16 h-16 opacity-50 grayscale" alt="Logo" />
                                </div>
                                <div className="text-center">
                                    <h3 className="font-semibold text-xl mb-1">Welcome to TeamHub Chat</h3>
                                    <p className="text-sm">Select a group or user to start chatting.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 3. User List / DMs (Right) */}
                    <DMSidebar />

                    {/* 4. Info Sidebar (Overlay) */}
                    {showInfo && activeConversationId && (
                        <div className="absolute right-0 top-0 h-full z-20 shadow-xl border-l bg-background">
                            <InfoSidebar onClose={() => setShowInfo(false)} />
                        </div>
                    )}
                </div>
            </DialogContent>

            <NewConversationDialog
                open={showNewGroup}
                onOpenChange={setShowNewGroup}
            />
        </Dialog>
    );
};
