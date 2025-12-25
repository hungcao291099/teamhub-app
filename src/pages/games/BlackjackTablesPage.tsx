import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTables, joinTable, GAMES } from "@/services/gamesService";
import { TableCard } from "@/components/games/TableCard";
import { Button } from "@/components/ui/button";
import { CreateTableDialog } from "@/components/games/CreateTableDialog";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Table {
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
}

export function BlackjackTablesPage() {
    const { gameType } = useParams<{ gameType: string }>();
    const navigate = useNavigate();
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);

    const game = GAMES.find(g => g.id === gameType);

    const loadTables = async () => {
        if (!gameType) return;
        try {
            const data = await getTables(gameType);
            setTables(data);
        } catch (error) {
            console.error("Failed to load tables:", error);
            toast.error("Không thể tải danh sách bàn");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTables();
        const interval = setInterval(loadTables, 5000);
        return () => clearInterval(interval);
    }, [gameType]);

    const handleJoin = async (tableId: number) => {
        try {
            await joinTable(tableId);
            navigate(`/games/${gameType}/${tableId}`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Không thể vào bàn");
        }
    };

    const handleTableCreated = () => {
        setCreateOpen(false);
        loadTables();
    };

    if (!game) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground">Game không tồn tại</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 min-h-screen pb-10">
            {/* Casino Floor Header */}
            <div className="flex flex-col gap-4 bg-gradient-to-r from-red-950 via-red-900 to-red-950 p-6 rounded-2xl border-b-2 border-amber-500/30 shadow-2xl relative overflow-hidden mx-2 mt-2">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none rotate-12">
                    <span className="text-8xl">🧧</span>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/games")} className="text-amber-200 hover:bg-white/10 h-10 w-10">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div className="flex-1">
                        <h2 className="text-2xl font-black text-amber-200 flex items-center gap-2 tracking-tight uppercase">
                            <span className="text-3xl filter drop-shadow-lg">{game.icon}</span>
                            {game.name} <span className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded ml-1">VIP</span>
                        </h2>
                        <p className="text-xs text-amber-100/60 font-bold uppercase tracking-widest mt-1">Sảnh bài hên - Xuân Bính Ngọ 2026</p>
                    </div>
                </div>

                <div className="flex justify-between items-end relative z-10 mt-4">
                    <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-500 text-[10px] font-black px-3 py-1 rounded-lg border border-amber-500/20 uppercase tracking-wider">
                            <Plus className="h-3 w-3" /> THƯỞNG TẾT
                        </div>
                        <div className="flex items-center gap-1.5 bg-red-600/10 text-red-500 text-[10px] font-black px-3 py-1 rounded-lg border border-red-600/20 uppercase tracking-wider">
                            MỞ BÁT HÊN 🧧
                        </div>
                    </div>
                    <Button onClick={() => setCreateOpen(true)} className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-black shadow-xl shadow-amber-500/20 px-6 h-12 rounded-xl scale-100 hover:scale-105 transition-transform active:scale-95">
                        <Plus className="h-5 w-5 mr-2" />
                        MỞ BÀN MỚI
                    </Button>
                </div>
            </div>

            {/* Tables Grid */}
            <div className="px-4 space-y-8">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
                    </div>
                ) : tables.length === 0 ? (
                    <div className="text-center py-20 space-y-6 bg-black/20 rounded-3xl border border-white/5 max-w-lg mx-auto backdrop-blur-sm">
                        <div className="text-7xl mb-4 opacity-10 animate-pulse">🂠</div>
                        <div className="space-y-2">
                            <p className="text-amber-200/60 font-black uppercase tracking-widest text-sm">Sảnh đang chờ chủ bàn</p>
                            <p className="text-gray-500 text-xs">Hãy là người đầu tiên mở bàn khai xuân đón lộc!</p>
                        </div>
                        <Button onClick={() => setCreateOpen(true)} size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-black px-8 py-6 rounded-2xl shadow-2xl scale-100 hover:scale-110 transition-transform">
                            <Plus className="h-6 w-6 mr-2" />
                            KHAI XUÂN NGAY
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <h3 className="text-amber-500 font-black uppercase tracking-widest text-xs flex items-center gap-3">
                                <span className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_100px_rgba(245,158,11,0.8)]"></span>
                                CÁC BÀN ĐANG TRỐNG SEAT
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">TOTAL:</span>
                                <span className="text-sm font-black text-white">{tables.length}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {tables.map((table) => (
                                <TableCard
                                    key={table.id}
                                    {...table}
                                    onJoin={handleJoin}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <CreateTableDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                gameType={gameType!}
                onCreated={handleTableCreated}
            />
        </div>
    );
}
