import React from "react";
import { DiscordLayout } from "./discord/DiscordLayout";
import { useChat } from "@/context/ChatContext";

interface ChatDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const ChatDialog: React.FC<ChatDialogProps> = ({ open, onOpenChange }) => {
    const { setChatDialogOpen } = useChat();

    // Track dialog open/close state
    React.useEffect(() => {
        setChatDialogOpen(open);
    }, [open, setChatDialogOpen]);

    return (
        <DiscordLayout open={open} onOpenChange={onOpenChange} />
    );
};
