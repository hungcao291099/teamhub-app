import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTables, joinTable, GAMES } from "@/services/gamesService";
import { TableCard } from "@/components/games/TableCard";
import { CreateTableDialog } from "@/components/games/CreateTableDialog";
import { InviteUserDialog } from "@/components/games/InviteUserDialog";
import { Button } from "@/components/ui/button";
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
    const [inviteTableId, setInviteTableId] = useState<number | null>(null);

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
        // Poll for updates every 5 seconds
        const interval = setInterval(loadTables, 5000);
        return () => clearInterval(interval);
    }, [gameType]);

    const handleJoin = async (tableId: number) => {
        try {
            const result = await joinTable(tableId);
            if (result.alreadyJoined) {
                toast.info("Đang vào bàn của bạn...");
            } else {
                toast.success("Đã vào bàn!");
            }
            navigate(`/games/${gameType}/${tableId}`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Không thể vào bàn");
        }
    };

    const handleInvite = (tableId: number) => {
        setInviteTableId(tableId);
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/games")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <span className="text-2xl">{game.icon}</span>
                        {game.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">{game.description}</p>
                </div>
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo bàn
                </Button>
            </div>

            {/* Tables List */}
            {loading ? (
                <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : tables.length === 0 ? (
                <div className="text-center py-10 space-y-4">
                    <p className="text-muted-foreground">Chưa có bàn nào</p>
                    <Button onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Tạo bàn đầu tiên
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {tables.map((table) => (
                        <TableCard
                            key={table.id}
                            {...table}
                            onJoin={handleJoin}
                            onInvite={handleInvite}
                        />
                    ))}
                </div>
            )}

            {/* Create Table Dialog */}
            <CreateTableDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                gameType={gameType!}
                onCreated={handleTableCreated}
            />

            {/* Invite User Dialog */}
            <InviteUserDialog
                tableId={inviteTableId}
                onOpenChange={(open) => !open && setInviteTableId(null)}
            />
        </div>
    );
}
