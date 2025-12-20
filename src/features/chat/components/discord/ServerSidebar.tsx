import React from "react";
import { useChat } from "@/context/ChatContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { Plus } from "lucide-react";
import { getImageUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ServerSidebarProps {
    onAddGroup: () => void;
}

export const ServerSidebar: React.FC<ServerSidebarProps> = ({ onAddGroup }) => {
    const { conversations, activeConversationId, setActiveConversation } = useChat();

    // Filter only group conversations
    const groups = conversations.filter(c => c.type === "group");

    return (
        <div className="w-[72px] flex flex-col items-center py-3 bg-secondary/30 border-r gap-2 h-full overflow-y-auto no-scrollbar">
            {/* Home / DM Button (Optional, maybe for 'All Friends') */}
            {/* <div className="mb-2">
                <Button variant="ghost" className="h-12 w-12 rounded-[24px] hover:rounded-[16px] transition-all bg-primary/10">
                    <img src="/logo.png" alt="Home" className="w-8 h-8" />
                </Button>
            </div> */}

            {/* Separator */}
            {/* <div className="w-8 h-[2px] bg-border rounded-full mb-2" /> */}

            {/* Group List */}
            <TooltipProvider delayDuration={0}>
                {groups.map((group) => {
                    const isActive = group.id === activeConversationId;
                    const displayName = group.name || "Group Chat";
                    const avatarText = displayName.charAt(0).toUpperCase();

                    return (
                        <Tooltip key={group.id}>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => setActiveConversation(group.id)}
                                    className={cn(
                                        "group relative flex items-center justify-center w-12 h-12 transition-all duration-200",
                                        "hover:bg-primary/20 hover:rounded-[16px]",
                                        isActive ? "bg-primary text-primary-foreground rounded-[16px]" : "rounded-[24px] bg-background text-foreground hover:text-primary"
                                    )}
                                >
                                    {/* Active Indicator Pits */}
                                    {isActive && (
                                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-8 bg-foreground rounded-r-full" />
                                    )}
                                    {!isActive && (
                                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-2 bg-foreground/50 rounded-r-full opacity-0 group-hover:opacity-100 transition-all duration-200 scale-0 group-hover:scale-100" />
                                    )}

                                    <Avatar className="h-full w-full bg-transparent">
                                        <AvatarImage
                                            src={getImageUrl(undefined)} // Group avatar URL if exists
                                            className="object-cover"
                                        />
                                        <AvatarFallback className="bg-transparent text-inherit font-semibold">
                                            {avatarText}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="font-semibold" sideOffset={10}>
                                {displayName}
                                {group.unreadCount > 0 && (
                                    <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{group.unreadCount}</span>
                                )}
                            </TooltipContent>
                        </Tooltip>
                    );
                })}

                {/* Add Group Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={onAddGroup}
                            className="group flex items-center justify-center w-12 h-12 rounded-[24px] bg-background hover:bg-green-500 hover:text-white hover:rounded-[16px] transition-all duration-200 text-green-500 mt-2"
                        >
                            <Plus className="h-6 w-6 transition-transform group-hover:rotate-90" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={10}>
                        <p>Thêm nhóm mới</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
};
