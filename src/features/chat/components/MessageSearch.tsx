import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { useChat } from "@/context/ChatContext";

interface MessageSearchProps {
    onMessageClick?: (messageId: number) => void;
}

export const MessageSearch: React.FC<MessageSearchProps> = ({ onMessageClick }) => {
    const { messages } = useChat();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredMessages = searchQuery.trim()
        ? messages.filter((msg) =>
            msg.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    return (
        <div className="relative">
            {!isOpen ? (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(true)}
                    title="Tìm kiếm tin nhắn"
                >
                    <Search className="h-5 w-5" />
                </Button>
            ) : (
                <div className="flex items-center gap-2 w-full">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm tin nhắn..."
                            className="pl-10 pr-8"
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setIsOpen(false);
                            setSearchQuery("");
                        }}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            )}

            {/* Search Results */}
            {isOpen && searchQuery && (
                <div className="absolute top-full mt-2 left-0 right-0 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto z-50">
                    {filteredMessages.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Không tìm thấy kết quả
                        </div>
                    ) : (
                        filteredMessages.map((msg) => (
                            <button
                                key={msg.id}
                                onClick={() => {
                                    onMessageClick?.(msg.id);
                                    setIsOpen(false);
                                    setSearchQuery("");
                                }}
                                className="w-full p-3 hover:bg-accent text-left border-b last:border-b-0"
                            >
                                <div className="text-xs text-muted-foreground">{msg.senderName}</div>
                                <div className="text-sm truncate">
                                    {msg.content.split(new RegExp(`(${searchQuery})`, "gi")).map((part, i) =>
                                        part.toLowerCase() === searchQuery.toLowerCase() ? (
                                            <mark key={i} className="bg-yellow-200 dark:bg-yellow-900">
                                                {part}
                                            </mark>
                                        ) : (
                                            part
                                        )
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
