import React, { useState, useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { LiquidSideBarItem } from "@/components/liquid/LiquidSideBar";
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
            <LiquidSideBarItem
                item={{ icon: MessageSquare, label: "Tin nhắn" }}
                onClick={() => setIsOpen(true)}
                className={showRipple ? "animate-pulse" : ""}
            >
                {showRipple && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none">
                        <span className="absolute inset-0 rounded-full bg-primary opacity-75 animate-ping"></span>
                        <span className="absolute inset-0 rounded-full bg-primary opacity-50 animate-ping animation-delay-300"></span>
                    </div>
                )}

                {unreadTotal > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                        {unreadTotal > 99 ? "99+" : unreadTotal}
                    </span>
                )}
            </LiquidSideBarItem>

            <ChatDialog open={isOpen} onOpenChange={setIsOpen} />
        </>
    );
};
