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
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Chọn Game</h2>
                <p className="text-muted-foreground">Đặt cược credit và thách đấu cùng đồng nghiệp!</p>
            </div>

            <div className="grid gap-4">
                {GAMES.map((game) => (
                    <GameCard key={game.id} {...game} />
                ))}
            </div>

            {/* Hint for cheatcode - subtle */}
            <p className="text-center text-xs text-muted-foreground/50 mt-8">
                💡 Tip: Có thể bạn biết một vài cheatcode bí mật...
            </p>
        </div>
    );
}
