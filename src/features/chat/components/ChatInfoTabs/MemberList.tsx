import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getImageUrl } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Shield, UserMinus, MoreVertical, Crown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface GroupMember {
    id: number;
    userId: number;
    username: string;
    name?: string | null;
    avatarUrl?: string | null;
    role: "owner" | "admin" | "member";
    joinedAt: string;
}

interface MemberListProps {
    participants: GroupMember[];
    currentUserRole: string; // "owner" | "admin" | "member"
    onRemoveMember: (userId: number) => void;
    onPromoteMember: (userId: number, currentRole: string) => void;
}

export const MemberList: React.FC<MemberListProps> = ({
    participants,
    currentUserRole,
    onRemoveMember,
    onPromoteMember
}) => {
    const { onlineUsers } = useAuth();

    // Helper access checks
    // Copied logic from GroupInfoDialog to ensure consistent permission behavior
    const canRemoveMembers = currentUserRole === "owner" || currentUserRole === "admin";
    const canPromoteMembers = currentUserRole === "owner";

    const getRoleBadge = (role: string) => {
        if (role === "owner") {
            return (
                <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded text-xs font-medium">
                    <Crown className="h-3 w-3" />
                    Trưởng nhóm
                </div>
            );
        }
        if (role === "admin") {
            return (
                <div className="flex items-center gap-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-medium">
                    <Shield className="h-3 w-3" />
                    Quản trị viên
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-2">
            {participants.map((member) => {
                const isOnline = onlineUsers.includes(member.userId);
                const canRemove = canRemoveMembers && member.role !== "owner";
                // Prevent admins from removing other admins, if that's the rule? 
                // GroupInfoDialog logic was: canRemoveMembers && member.role !== "owner".
                // Usually admins can't remove other admins or owner. 
                // Assuming original logic was correct or simple enough.

                const canPromote = canPromoteMembers && member.role !== "owner";
                const showActions = canRemove || canPromote;

                return (
                    <div
                        key={member.id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-accent"
                    >
                        <div className="relative w-8 h-8 shrink-0">
                            <Avatar className="h-full w-full">
                                <AvatarImage src={getImageUrl(member.avatarUrl) || undefined} alt={member.username} />
                                <AvatarFallback>
                                    {member.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {isOnline && (
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full z-10" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                                {member.username}
                            </div>
                            {member.name && (
                                <div className="text-sm text-muted-foreground truncate">
                                    {member.name}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {getRoleBadge(member.role)}

                            {showActions && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {canPromote && (
                                            <DropdownMenuItem onClick={() => onPromoteMember(member.userId, member.role)}>
                                                <Shield className="h-4 w-4 mr-2" />
                                                {member.role === "admin" ? "Hạ quản trị viên" : "Thăng quản trị viên"}
                                            </DropdownMenuItem>
                                        )}
                                        {canRemove && (
                                            <DropdownMenuItem
                                                onClick={() => onRemoveMember(member.userId)}
                                                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                                            >
                                                <UserMinus className="h-4 w-4 mr-2" />
                                                Xóa khỏi nhóm
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
