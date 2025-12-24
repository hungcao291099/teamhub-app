import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ArrowLeft, LogOut, Play, Hand, Square, Loader2, Users, Coins, Timer } from "lucide-react";
import { GAMES, getTable, leaveTable, placeBet, startGame, hit, stand, getSuitSymbol, getSuitColor, checkTimeout, TURN_TIMEOUT_MS } from "@/services/gamesService";
import { useGames } from "@/context/GamesContext";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface CardType {
    suit: string;
    rank: string;
    value: number;
}

interface HandType {
    cards: CardType[];
    score: number;
    isBusted: boolean;
    isBlackjack: boolean;
    isDoubleAce: boolean;
    isFiveCard: boolean;
}

interface Participant {
    id: number;
    userId: number;
    status: string;
    currentBet: number;
    handState?: string;
    user: {
        id: number;
        username: string;
        name?: string;
        avatarUrl?: string;
    } | null;
}

interface TableData {
    id: number;
    name: string;
    status: string;
    gameType: string;
    createdById: number;
    gameState?: string;
    participants: Participant[];
}

// Playing Card Component
function PlayingCard({ card, hidden = false }: { card: CardType; hidden?: boolean }) {
    if (hidden) {
        return (
            <div className="w-14 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg border-2 border-blue-400 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🂠</span>
            </div>
        );
    }

    const suitSymbol = getSuitSymbol(card.suit);
    const suitColorClass = getSuitColor(card.suit);

    return (
        <div className="w-14 h-20 bg-white rounded-lg border-2 border-gray-300 flex flex-col items-center justify-center shadow-lg relative">
            <span className={`text-lg font-bold ${suitColorClass}`}>{card.rank}</span>
            <span className={`text-xl ${suitColorClass}`}>{suitSymbol}</span>
        </div>
    );
}

// Hand display component
function HandDisplay({ hand, label, isDealer = false, hideSecond = false }: {
    hand: HandType | null;
    label: string;
    isDealer?: boolean;
    hideSecond?: boolean;
}) {
    if (!hand || !hand.cards) return null;

    return (
        <div className="text-center space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">{label}</p>
            <div className="flex gap-1 justify-center">
                {hand.cards.map((card, i) => (
                    <PlayingCard
                        key={i}
                        card={card}
                        hidden={isDealer && hideSecond && i === 1}
                    />
                ))}
            </div>
            {!hideSecond && (
                <p className="text-lg font-bold">
                    {hand.score} điểm
                    {hand.isBlackjack && <span className="text-yellow-500 ml-2">Xì Dách!</span>}
                    {hand.isDoubleAce && <span className="text-yellow-500 ml-2">Xì Bàng!</span>}
                    {hand.isFiveCard && <span className="text-green-500 ml-2">Ngũ Linh!</span>}
                    {hand.isBusted && <span className="text-red-500 ml-2">Quắc!</span>}
                </p>
            )}
        </div>
    );
}

export function BlackjackGamePage() {
    const { gameType, tableId } = useParams();
    const navigate = useNavigate();
    const { credit, refreshCredit } = useGames();
    const { currentUser } = useAuth();

    const [table, setTable] = useState<TableData | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [betAmount, setBetAmount] = useState("100");
    const [myHand, setMyHand] = useState<HandType | null>(null);
    const [dealerHand, setDealerHand] = useState<HandType | null>(null);
    const [currentTurn, setCurrentTurn] = useState<number | string | null>(null);
    const [results, setResults] = useState<any[] | null>(null);
    const [turnStartTime, setTurnStartTime] = useState<number | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(30);

    const game = GAMES.find(g => g.id === gameType);
    const tableIdNum = parseInt(tableId || "0");
    const isOwner = table?.createdById === currentUser?.id;
    const isMyTurn = currentTurn === currentUser?.id;
    const isWaiting = table?.status === "waiting";
    const isPlaying = table?.status === "playing";
    const isFinished = table?.status === "finished";

    const loadTable = useCallback(async () => {
        // Skip if no valid tableId
        if (!gameType || !tableId || isNaN(tableIdNum) || tableIdNum <= 0) {
            setLoading(false);
            return;
        }
        try {
            const data = await getTable(gameType, tableIdNum);
            setTable(data);

            // Parse game state
            if (data.gameState) {
                const gs = JSON.parse(data.gameState);
                setDealerHand(gs.dealer);
                setCurrentTurn(gs.currentTurn);
                setTurnStartTime(gs.turnStartTime || null);
                if (gs.results) setResults(gs.results);
            }

            // Find my hand
            const myPart = data.participants.find((p: Participant) => p.userId === currentUser?.id);
            if (myPart?.handState) {
                setMyHand(JSON.parse(myPart.handState));
            }
            if (myPart?.currentBet) {
                setBetAmount(myPart.currentBet.toString());
            }
        } catch (error) {
            console.error("Failed to load table:", error);
        } finally {
            setLoading(false);
        }
    }, [gameType, tableId, tableIdNum, currentUser?.id]);

    useEffect(() => {
        loadTable();
        const interval = setInterval(loadTable, 2000);
        return () => clearInterval(interval);
    }, [loadTable]);

    // Timer countdown effect
    useEffect(() => {
        if (!turnStartTime || !isPlaying || isNaN(tableIdNum) || tableIdNum <= 0) {
            setTimeRemaining(30);
            return;
        }

        const updateTimer = () => {
            const elapsed = Date.now() - turnStartTime;
            const remaining = Math.max(0, Math.ceil((TURN_TIMEOUT_MS - elapsed) / 1000));
            setTimeRemaining(remaining);

            // Check timeout if time is up
            if (remaining === 0 && !isNaN(tableIdNum) && tableIdNum > 0) {
                checkTimeout(tableIdNum).then((result) => {
                    if (result.timedOut) {
                        toast.info("Hết thời gian! Lượt đã bị bỏ qua.");
                        loadTable();
                    }
                }).catch(() => { });
            }
        };

        updateTimer();
        const timerInterval = setInterval(updateTimer, 1000);
        return () => clearInterval(timerInterval);
    }, [turnStartTime, isPlaying, tableIdNum, loadTable]);

    const handleLeave = async () => {
        setActionLoading(true);
        try {
            await leaveTable(tableIdNum);
            toast.success("Đã rời bàn");
            navigate(`/games/${gameType}`);
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Không thể rời bàn");
        } finally {
            setActionLoading(false);
        }
    };

    const handleBet = async () => {
        const amount = parseInt(betAmount);
        if (isNaN(amount) || amount < 10) {
            toast.error("Cược tối thiểu 10 credits");
            return;
        }
        if (amount > credit) {
            toast.error("Không đủ credits");
            return;
        }

        setActionLoading(true);
        try {
            await placeBet(tableIdNum, amount);
            toast.success(`Đã đặt cược ${amount} credits`);
            loadTable();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Không thể đặt cược");
        } finally {
            setActionLoading(false);
        }
    };

    const handleStart = async () => {
        setActionLoading(true);
        try {
            await startGame(tableIdNum);
            toast.success("Bắt đầu ván chơi!");
            loadTable();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Không thể bắt đầu");
        } finally {
            setActionLoading(false);
        }
    };

    const handleHit = async () => {
        setActionLoading(true);
        try {
            const result = await hit(tableIdNum);
            setMyHand(result.hand);
            setCurrentTurn(result.currentTurn);
            if (result.hand.isBusted) {
                toast.error("Quắc! Bạn đã thua");
            }
            loadTable();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Lỗi");
        } finally {
            setActionLoading(false);
        }
    };

    const handleStand = async () => {
        setActionLoading(true);
        try {
            const result = await stand(tableIdNum);
            if (result.finished) {
                setDealerHand(result.dealer);
                setResults(result.results);
                refreshCredit();
                toast.success("Ván chơi kết thúc!");
            }
            loadTable();
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Lỗi");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!table) {
        return (
            <div className="text-center py-10">
                <p className="text-muted-foreground">Bàn không tồn tại</p>
                <Button variant="outline" onClick={() => navigate(`/games/${gameType}`)} className="mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Quay lại
                </Button>
            </div>
        );
    }

    const joinedPlayers = table.participants.filter(p => p.status === "joined");
    const myResult = results?.find(r => r.userId === currentUser?.id);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/games/${gameType}`)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <span className="text-2xl">{game?.icon}</span>
                        {table.name}
                    </h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        {joinedPlayers.length} người chơi
                        {isWaiting && " • Đang chờ"}
                        {isPlaying && " • Đang chơi"}
                        {isFinished && " • Kết thúc"}
                    </p>
                </div>

                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleLeave}
                    disabled={actionLoading || isPlaying}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Thoát
                </Button>
            </div>

            {/* Dealer Area */}
            {(isPlaying || isFinished) && dealerHand && (
                <Card className="bg-green-900/30 border-green-700">
                    <CardContent className="p-4">
                        <HandDisplay
                            hand={dealerHand}
                            label="Nhà Cái (Máy)"
                            isDealer
                            hideSecond={isPlaying && currentTurn !== 'dealer' && currentTurn !== 'finished'}
                        />
                    </CardContent>
                </Card>
            )}

            {/* My Hand */}
            {(isPlaying || isFinished) && myHand && (
                <Card className={isMyTurn ? "border-primary border-2" : ""}>
                    <CardContent className="p-4">
                        <HandDisplay hand={myHand} label="Bài của bạn" />

                        {/* Actions */}
                        {isMyTurn && !myHand.isBusted && myHand.cards.length < 5 && (
                            <div className="mt-4 space-y-2">
                                {/* Timer */}
                                <div className="flex justify-center items-center gap-2 mb-2">
                                    <Timer className="h-4 w-4 text-muted-foreground" />
                                    <span className={`text-lg font-bold ${timeRemaining <= 10 ? "text-red-500 animate-pulse" : "text-muted-foreground"}`}>
                                        {timeRemaining}s
                                    </span>
                                </div>
                                <div className="flex justify-center gap-3">
                                    <Button onClick={handleHit} disabled={actionLoading}>
                                        <Hand className="h-4 w-4 mr-2" />
                                        Rút bài
                                    </Button>
                                    <Button variant="secondary" onClick={handleStand} disabled={actionLoading}>
                                        <Square className="h-4 w-4 mr-2" />
                                        Dừng
                                    </Button>
                                </div>
                            </div>
                        )}

                        {isMyTurn && (myHand.isBusted || myHand.cards.length >= 5) && (
                            <p className="text-center text-muted-foreground mt-2">
                                Đang chờ người khác...
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Result */}
            {isFinished && myResult && (
                <Card className={myResult.winnings > 0 ? "bg-green-900/30" : myResult.winnings < 0 ? "bg-red-900/30" : ""}>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold">{myResult.description}</p>
                        <p className="text-lg">
                            {myResult.winnings > 0 && <span className="text-green-400">+{myResult.winnings}</span>}
                            {myResult.winnings < 0 && <span className="text-red-400">{myResult.winnings}</span>}
                            {myResult.winnings === 0 && <span className="text-muted-foreground">Hòa</span>}
                            {" credits"}
                        </p>
                        <Button onClick={handleLeave} className="mt-4">
                            Thoát về danh sách
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Waiting Area */}
            {isWaiting && (
                <Card>
                    <CardContent className="p-4 space-y-4">
                        <h3 className="font-semibold">Đặt cược</h3>

                        <div className="flex gap-2">
                            <Input
                                type="number"
                                min="10"
                                value={betAmount}
                                onChange={(e) => setBetAmount(e.target.value)}
                                className="flex-1"
                            />
                            <Button onClick={handleBet} disabled={actionLoading}>
                                <Coins className="h-4 w-4 mr-2" />
                                Đặt
                            </Button>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                            {[50, 100, 200, 500].map(amt => (
                                <Button
                                    key={amt}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setBetAmount(amt.toString())}
                                >
                                    {amt}
                                </Button>
                            ))}
                        </div>

                        {/* Players and bets */}
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Người chơi:</p>
                            {joinedPlayers.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-2 bg-accent/30 rounded">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={p.user?.avatarUrl} />
                                            <AvatarFallback>{(p.user?.name || "?")[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">{p.user?.name || p.user?.username}</span>
                                    </div>
                                    <span className={`text-sm ${p.currentBet > 0 ? "text-yellow-500" : "text-muted-foreground"}`}>
                                        {p.currentBet > 0 ? `${p.currentBet} credits` : "Chưa đặt"}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Start button */}
                        {isOwner && (
                            <Button onClick={handleStart} disabled={actionLoading} className="w-full">
                                <Play className="h-4 w-4 mr-2" />
                                Bắt đầu ván chơi
                            </Button>
                        )}

                        {!isOwner && (
                            <p className="text-center text-sm text-muted-foreground">
                                Đang chờ chủ phòng bắt đầu...
                            </p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Other players (when playing) */}
            {isPlaying && joinedPlayers.filter(p => p.userId !== currentUser?.id).length > 0 && (
                <Card>
                    <CardContent className="p-4">
                        <h3 className="font-semibold mb-3">Người chơi khác</h3>
                        <div className="space-y-3">
                            {joinedPlayers.filter(p => p.userId !== currentUser?.id).map(p => {
                                const hand = p.handState ? JSON.parse(p.handState) : null;
                                return (
                                    <div key={p.id} className={`p-2 rounded ${currentTurn === p.userId ? "bg-primary/20 border border-primary" : "bg-accent/30"}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={p.user?.avatarUrl} />
                                                <AvatarFallback>{(p.user?.name || "?")[0]}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm font-medium">{p.user?.name || p.user?.username}</span>
                                            {currentTurn === p.userId && <span className="text-xs text-primary">← Đang chơi</span>}
                                        </div>
                                        {hand && (
                                            <div className="flex gap-1">
                                                {hand.cards.map((c: CardType, i: number) => (
                                                    <PlayingCard key={i} card={c} />
                                                ))}
                                                <span className="ml-2 self-center text-sm">{hand.score} điểm</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
