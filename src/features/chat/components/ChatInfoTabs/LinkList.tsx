import React, { useState, useEffect } from "react";
import { chatApi, Message } from "@/services/chatApi";
import { Link2, ExternalLink } from "lucide-react";

interface LinkListProps {
    conversationId: number;
}

export const LinkList: React.FC<LinkListProps> = ({ conversationId }) => {
    const [links, setLinks] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLinks = async () => {
            setLoading(true);
            try {
                // Similar to MediaList, we filter client-side for now
                // Ideally this should use a backend filter API
                const res = await chatApi.getMessages(conversationId, 1); // Get recent 50
                // Simple regex or detection of links in content?
                // Or check if type === 'text' and content contains http
                const linkMessages = res.messages.filter(m =>
                    m.type === 'text' && /(https?:\/\/[^\s]+)/g.test(m.content)
                );

                setLinks(linkMessages);
            } catch (error) {
                console.error("Error loading links:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLinks();
    }, [conversationId]);

    const extractFirstLink = (text: string) => {
        const match = text.match(/(https?:\/\/[^\s]+)/);
        return match ? match[0] : null;
    };

    if (loading) {
        return <div className="text-center py-4 text-muted-foreground">Đang tải...</div>;
    }

    if (links.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground text-sm">
                Chưa có liên kết nào
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {links.map((msg) => {
                const url = extractFirstLink(msg.content);
                if (!url) return null;

                return (
                    <div key={msg.id} className="flex items-start gap-3 p-2 rounded hover:bg-accent group">
                        <div className="bg-muted p-2 rounded text-muted-foreground">
                            <Link2 className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block"
                            >
                                {url}
                            </a>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <span>{msg.senderName}</span>
                                <span>•</span>
                                <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-foreground transition-opacity"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </div>
                );
            })}
        </div>
    );
};
