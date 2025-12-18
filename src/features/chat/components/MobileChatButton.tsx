import React, { useState, useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/context/ChatContext";
import { ChatDialog } from "./ChatDialog";

export const MobileChatButton: React.FC = () => {
    const { unreadTotal } = useChat();
    const [isOpen, setIsOpen] = useState(false);
    const [showRipple, setShowRipple] = useState(false);
    const prevUnreadRef = useRef(unreadTotal);

    // Trigger ripple animation when new unread message arrives
    useEffect(() => {
        if (unreadTotal > prevUnreadRef.current && unreadTotal > 0) {
            setShowRipple(true);
            const timer = setTimeout(() => setShowRipple(false), 2000);
            return () => clearTimeout(timer);
        }

        // Stop ripple immediately when all messages are read
        if (unreadTotal === 0) {
            setShowRipple(false);
        }

        prevUnreadRef.current = unreadTotal;
    }, [unreadTotal]);

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(true)}
                className={`relative ${showRipple ? "text-primary" : ""}`}
            >
                <div className="relative">
                    <MessageSquare className="h-5 w-5" />

                    {showRipple && (
                        <div className="absolute inset-0 pointer-events-none">
                            <span className="absolute inset-0 rounded-full bg-primary opacity-75 animate-ping"></span>
                        </div>
                    )}
                </div>

                {unreadTotal > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                        {unreadTotal > 99 ? "99+" : unreadTotal}
                    </span>
                )}
            </Button>

            <ChatDialog open={isOpen} onOpenChange={setIsOpen} />
        </>
    );
};
