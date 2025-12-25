import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GAMES, getActiveTable } from "@/services/gamesService";
import { GameCard } from "@/components/games/GameCard";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function GamesPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [checking, setChecking] = useState(true);

    // Check for active table on mount - force redirect if in a table
    useEffect(() => {
        const checkActiveTable = async () => {
            try {
                const result = await getActiveTable();
                if (result.hasActiveTable) {
                    toast.info(`Đang chuyển đến bàn "${result.tableName}"...`);
                    navigate(`/games/${result.gameType}/${result.tableId}`, { replace: true });
                    return;
                }
            } catch (error) {
                console.error("Error checking active table:", error);
            } finally {
                setChecking(false);
            }
        };

        checkActiveTable();
    }, [navigate, location.pathname]);

    if (checking) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-8 min-h-[80vh] pb-10">
            {/* Tet 2026 Decorative Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-900 via-red-800 to-amber-900 p-8 text-center shadow-2xl border-b-4 border-amber-500/50">
                {/* Decorative Flowers (Simulated with text/icons) */}
                <div className="absolute top-2 left-4 text-3xl animate-bounce">🌸</div>
                <div className="absolute top-10 right-10 text-4xl animate-pulse">🧧</div>
                <div className="absolute bottom-4 left-10 text-2xl rotate-12">🧧</div>
                <div className="absolute top-4 right-4 text-3xl">🌸</div>

                <div className="relative z-10 space-y-3">
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 drop-shadow-sm">
                        MỪNG XUÂN 2026
                    </h1>
                    <div className="flex justify-center items-center gap-4 py-2">
                        <div className="h-[1px] w-12 bg-amber-500/50"></div>
                        <span className="text-amber-200 font-serif italic text-lg whitespace-nowrap">Phát Tài Phát Lộc</span>
                        <div className="h-[1px] w-12 bg-amber-500/50"></div>
                    </div>
                    <p className="text-amber-100/80 font-medium">
                        Thử vận may đầu năm - Rinh ngàn quà tặng!
                    </p>
                </div>

                {/* Light reflection effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 translate-x-[-100%] animate-[shimmer_3s_infinite]" />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {GAMES.map((game) => (
                    <div key={game.id} className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-red-600 rounded-xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative">
                            <GameCard {...game} />
                        </div>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}
