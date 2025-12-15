import React from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Reply, Trash2 } from "lucide-react";

interface MessageContextMenuProps {
    isOwn: boolean;
    onReply: () => void;
    onDelete?: () => void;
    children: React.ReactNode;
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
    isOwn,
    onReply,
    onDelete,
    children,
}) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {children}
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={onReply}>
                    <Reply className="h-4 w-4 mr-2" />
                    Trả lời
                </DropdownMenuItem>
                {isOwn && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onDelete} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
