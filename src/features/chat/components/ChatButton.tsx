import React, { useState, useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/context/ChatContext";
import { ChatDialog } from "./ChatDialog";

export const ChatButton: React.FC = () => {
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
                onClick={() => setIsOpen(true)}
                className={`w-full justify-start text-muted-foreground hover:text-blue-600 hover:bg-blue-600/10 hover:shadow-none border-0 relative ${showRipple ? "animate-pulse" : ""
                    }`}
            >
                <div className="relative">
                    <MessageSquare className="h-5 w-5 mr-3" />
                    {showRipple && (
                        <>
                            <span className="absolute inset-0 rounded-full bg-blue-500 opacity-75 animate-ping"></span>
                            <span className="absolute inset-0 rounded-full bg-blue-500 opacity-50 animate-ping animation-delay-300"></span>
                        </>
                    )}
                </div>
                <span>Tin nhắn</span>
                {unreadTotal > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-bounce">
                        {unreadTotal > 99 ? "99+" : unreadTotal}
                    </span>
                )}
            </Button>

            <ChatDialog open={isOpen} onOpenChange={setIsOpen} />
        </>
    );
};
