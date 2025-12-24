import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarWithFrame } from "@/components/ui/avatar-with-frame";
import { getImageUrl } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Shield, UserMinus, MoreVertical, Crown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface GroupMember {
    id: number;
    userId: number;
    username: string;
    name?: string | null;
    avatarUrl?: string | null;
    selectedFrame?: string | null;
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
    // Sort participants: Owner -> Admin -> Member
    const sortedParticipants = [...participants].sort((a, b) => {
        const roleOrder = { owner: 0, admin: 1, member: 2 };
        if (roleOrder[a.role] !== roleOrder[b.role]) {
            return roleOrder[a.role] - roleOrder[b.role];
        }
        return a.username.localeCompare(b.username);
    });

    const canRemoveMembers = currentUserRole === "owner" || currentUserRole === "admin";
    const canPromoteMembers = currentUserRole === "owner";

    const getRoleBadge = (role: string) => {
        if (role === "owner") {
            return (
                <div className="flex items-center text-yellow-600 dark:text-yellow-500" title="Trưởng nhóm">
                    <Crown className="h-4 w-4" />
                </div>
            );
        }
        if (role === "admin") {
            return (
                <div className="flex items-center text-blue-600 dark:text-blue-500" title="Quản trị viên">
                    <Shield className="h-4 w-4" />
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-1">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2 mt-1">
                Thành viên ({participants.length})
            </div>

            {sortedParticipants.map((member) => {
                const isOnline = onlineUsers.includes(member.userId);
                // Cannot remove owner. Admin can remove members but not other admins/owner.
                // Owner can remove anyone.
                const canRemove = canRemoveMembers
                    && member.role !== "owner"
                    && (currentUserRole === "owner" || member.role !== "admin");

                const canPromote = canPromoteMembers && member.role !== "owner";
                const showActions = canRemove || canPromote;

                return (
                    <div
                        key={member.id}
                        className="group flex items-center justify-between p-3 mb-2 rounded-xl border bg-card/50 hover:bg-card hover:border-primary/20 hover:shadow-sm transition-all shadow-sm"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="relative w-10 h-10 shrink-0">
                                <AvatarWithFrame frameId={member.selectedFrame} size="sm">
                                    <Avatar className="h-full w-full border border-background shadow-sm">
                                        <AvatarImage src={getImageUrl(member.avatarUrl) || undefined} alt={member.username} className="object-cover" />
                                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                                            {member.username.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </AvatarWithFrame>
                                {isOnline && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full z-20 ring-1 ring-background" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-sm truncate">
                                        {member.name || member.username}
                                    </span>
                                    {getRoleBadge(member.role)}
                                </div>
                                <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                    @{member.username}
                                </div>
                            </div>
                        </div>

                        {showActions && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent rounded-full">
                                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    {canPromote && (
                                        <>
                                            <DropdownMenuItem onClick={() => onPromoteMember(member.userId, member.role)} className="cursor-pointer">
                                                <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
                                                <span>{member.role === "admin" ? "Hạ quyền quản trị" : "Thăng lên quản trị"}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                        </>
                                    )}
                                    {canRemove && (
                                        <DropdownMenuItem
                                            onClick={() => onRemoveMember(member.userId)}
                                            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 cursor-pointer"
                                        >
                                            <UserMinus className="h-4 w-4 mr-2" />
                                            Xóa khỏi nhóm
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {!showActions && member.role === "owner" && (
                            <div className="px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full uppercase tracking-wider">
                                Owner
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
