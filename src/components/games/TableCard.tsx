import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, Coins, Play, UserPlus } from "lucide-react";

interface TableCardProps {
    id: number;
    name: string;
    status: string;
    playerCount: number;
    maxPlayers: number;
    minBet: number;
    maxBet: number;
    createdBy: {
        id: number;
        username: string;
        name?: string;
        avatarUrl?: string;
    } | null;
    onJoin: (tableId: number) => void;
    onInvite: (tableId: number) => void;
}

export function TableCard({
    id,
    name,
    status,
    playerCount,
    maxPlayers,
    minBet,
    maxBet,
    createdBy,
    onJoin,
    onInvite
}: TableCardProps) {
    const isFull = playerCount >= maxPlayers;
    const isWaiting = status === "waiting";

    return (
        <Card className="hover:bg-accent/30 transition-colors">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    {/* Table Info */}
                    <div className="flex items-center gap-3">
                        {/* Creator Avatar */}
                        {createdBy && (
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={createdBy.avatarUrl} />
                                <AvatarFallback>
                                    {(createdBy.name || createdBy.username || "?")[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        )}

                        <div>
                            <h3 className="font-semibold text-foreground">{name}</h3>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                {/* Players */}
                                <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {playerCount}/{maxPlayers}
                                </span>

                                {/* Bet Range */}
                                <span className="flex items-center gap-1">
                                    <Coins className="h-3 w-3 text-yellow-500" />
                                    {minBet}-{maxBet}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onInvite(id)}
                            title="Mời bạn"
                        >
                            <UserPlus className="h-4 w-4" />
                        </Button>

                        <Button
                            variant={isFull ? "outline" : "default"}
                            size="sm"
                            disabled={isFull || !isWaiting}
                            onClick={() => onJoin(id)}
                            className="min-w-[80px]"
                        >
                            <Play className="h-4 w-4 mr-1" />
                            {isFull ? "Đầy" : "Vào"}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
