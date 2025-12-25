import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, Coins, Play, Sparkles } from "lucide-react";

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
    onJoin
}: TableCardProps) {
    const isFull = playerCount >= maxPlayers;
    const isWaiting = status === "waiting";
    const isPlaying = status === "playing";

    return (
        <Card className="hover:scale-[1.02] transition-all duration-300 border border-white/5 bg-black/60 backdrop-blur-md overflow-hidden group flex flex-col h-full">
            {/* Status Header */}
            <div className={`h-1 w-full ${isWaiting ? "bg-amber-500 animate-pulse" : isPlaying ? "bg-red-500" : "bg-gray-500"}`}></div>

            <CardContent className="p-5 flex flex-col flex-1 gap-4">
                {/* Header: Name & Status Badge */}
                <div className="flex justify-between items-start gap-2">
                    <h3 className="font-black text-amber-100 text-lg leading-tight uppercase tracking-tight group-hover:text-amber-400 transition-colors">
                        {name}
                    </h3>
                    <div className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${isWaiting ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                            isPlaying ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        }`}>
                        {isWaiting ? "CHỜ BẮT ĐẦU" : isPlaying ? "ĐANG CHƠI" : "KẾT THÚC"}
                    </div>
                </div>

                {/* Creator & Players Info */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Avatar className="h-8 w-8 ring-2 ring-amber-500/20">
                                <AvatarImage src={createdBy?.avatarUrl} />
                                <AvatarFallback className="bg-gray-800 text-amber-200 text-xs">
                                    {(createdBy?.name || createdBy?.username || "?")[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {status === "waiting" && <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-500 border-2 border-black rounded-full"></div>}
                        </div>
                        <span className="text-xs text-amber-100/60 font-medium truncate max-w-[80px]">
                            {createdBy?.name || createdBy?.username}
                        </span>
                    </div>

                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-amber-100/80 font-bold">
                            <Users className="h-3 w-3 text-amber-500" />
                            <span className="text-sm">{playerCount}/{maxPlayers}</span>
                        </div>
                        <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">SỐ NGƯỜI</span>
                    </div>
                </div>

                {/* Bet Range Section */}
                <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-3">
                    <div className="flex justify-between items-center bg-amber-500/5 px-3 py-2 rounded-xl border border-amber-500/10">
                        <div className="flex items-center gap-2">
                            <Coins className="h-4 w-4 text-amber-500" />
                            <div className="flex flex-col">
                                <span className="text-[9px] text-amber-500/60 font-black uppercase leading-none">Mức cược</span>
                                <span className="text-sm font-black text-amber-100">
                                    {minBet.toLocaleString()} - {maxBet.toLocaleString()}
                                </span>
                            </div>
                        </div>
                        {isFull && <div className="text-[10px] font-black text-red-400 bg-red-400/10 px-2 py-0.5 rounded border border-red-400/20">FULL</div>}
                    </div>

                    <Button
                        disabled={isPlaying || (isFull && !isPlaying)}
                        onClick={() => onJoin(id)}
                        className={`w-full h-11 font-black text-sm uppercase tracking-widest rounded-xl transition-all ${isWaiting
                                ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/20 scale-100 hover:scale-[1.03] active:scale-95"
                                : "bg-gray-800 text-gray-500 border border-white/5 grayscale"
                            }`}
                    >
                        {isPlaying ? (
                            <>ĐANG DIỄN RA</>
                        ) : isFull ? (
                            <>BÀN ĐÃ ĐẦY</>
                        ) : (
                            <><Play className="h-4 w-4 mr-2 fill-current" /> VÀO BÀN</>
                        )}
                    </Button>
                </div>
            </CardContent>

            {/* Decorative Tet Element */}
            <div className="absolute top-2 right-2 opacity-5 scale-150 rotate-12 pointer-events-none group-hover:opacity-10 transition-opacity">
                <Sparkles className="h-10 w-10 text-amber-500" />
            </div>
        </Card>
    );
}
