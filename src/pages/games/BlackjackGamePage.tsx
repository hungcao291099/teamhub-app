import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ArrowLeft, LogOut, Play, Hand, Square, Loader2, Coins, Timer, RotateCcw, Sparkles } from "lucide-react";
import { GAMES, getTable, leaveTable, placeBet, startGame, hit, stand, getSuitSymbol, getSuitColor, checkTimeout, TURN_TIMEOUT_MS, playAgain, transferDealer } from "@/services/gamesService";
import { useGames } from "@/context/GamesContext";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import "./BlackjackAnimations.css";

interface CardType { suit: string; rank: string; value: number; }
interface HandType { cards: CardType[]; score: number; isBusted: boolean; isBlackjack: boolean; isDoubleAce: boolean; isFiveCard: boolean; isNon?: boolean; }
interface Participant { id: number; userId: number; status: string; currentBet: number; handState?: string; user: { id: number; username: string; name?: string; avatarUrl?: string; } | null; }
interface TableData { id: number; name: string; status: string; gameType: string; createdById: number; dealerId: number; gameState?: string; participants: Participant[]; }

// Animated Card
function PlayingCard({ card, hidden = false, index = 0, animate = false }: { card: CardType; hidden?: boolean; index?: number; animate?: boolean }) {
    const delay = index * 0.15;

    if (hidden) {
        return (
            <div
                className={`w-7 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded border border-blue-400 flex items-center justify-center shadow text-xs ${animate ? 'card-deal' : ''}`}
                style={{ animationDelay: `${delay}s` }}
            >🂠</div>
        );
    }

    return (
        <div
            className={`w-7 h-10 bg-white rounded border border-gray-300 flex flex-col items-center justify-center shadow text-[10px] ${animate ? 'card-deal' : ''}`}
            style={{ animationDelay: `${delay}s` }}
        >
            <span className={`font-bold ${getSuitColor(card.suit)}`}>{card.rank}</span>
            <span className={getSuitColor(card.suit)}>{getSuitSymbol(card.suit)}</span>
        </div>
    );
}

// Compact Player Seat
function PlayerSeat({
    participant, isCurrentTurn, isMe, isDealer, hideCards, showResult, result, onTransferDealer, compact = false
}: {
    participant: Participant; isCurrentTurn: boolean; isMe: boolean; isDealer: boolean; hideCards: boolean;
    showResult: boolean; result?: { winnings: number; description: string }; onTransferDealer?: () => void; compact?: boolean;
}) {
    const hand: HandType | null = participant.handState ? JSON.parse(participant.handState) : null;
    const user = participant.user;
    const size = compact ? "h-8 w-8" : "h-10 w-10";

    return (
        <div className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all ${isDealer ? "bg-yellow-900/50 ring-1 ring-yellow-500" :
                isCurrentTurn ? "bg-green-500/30 ring-1 ring-green-400 animate-pulse" :
                    isMe ? "bg-primary/20" : "bg-black/30"
            }`}>
            <div className="relative">
                <Avatar className={`${size} border ${isDealer ? "border-yellow-500" : isCurrentTurn ? "border-green-400" : "border-white/30"}`}>
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback className="text-[10px] bg-gray-700">{(user?.name || "?")[0]}</AvatarFallback>
                </Avatar>
                {isDealer && <Sparkles className="absolute -top-0.5 -right-0.5 h-3 w-3 text-yellow-400" />}
            </div>

            <p className="text-[10px] font-medium text-white truncate max-w-[60px]">{user?.name || user?.username}</p>

            {isDealer && <span className="text-[8px] bg-yellow-500 text-black px-1 rounded font-bold">CÁI</span>}
            {!isDealer && participant.currentBet > 0 && (
                <span className="text-[8px] bg-orange-500 text-white px-1 rounded">🪙{participant.currentBet}</span>
            )}

            {onTransferDealer && !isDealer && (
                <Button size="sm" variant="ghost" className="text-[8px] h-4 px-1 text-yellow-400" onClick={onTransferDealer}>→Cái</Button>
            )}

            {hand && hand.cards && hand.cards.length > 0 && (
                <div className="flex gap-0.5 -space-x-2">
                    {hand.cards.map((card, i) => (
                        <PlayingCard key={i} card={card} hidden={hideCards && !isMe && !isDealer} index={i} animate />
                    ))}
                </div>
            )}

            {hand && (!hideCards || isMe || isDealer) && (
                <div className="text-[10px] font-bold text-white">
                    {hand.score}
                    {hand.isBlackjack && <span className="text-yellow-400"> XD</span>}
                    {hand.isDoubleAce && <span className="text-yellow-400"> XB</span>}
                    {hand.isFiveCard && <span className="text-green-400"> NL</span>}
                    {hand.isBusted && <span className="text-red-400"> Q</span>}
                </div>
            )}

            {showResult && result && !isDealer && (
                <div className={`text-[10px] font-bold px-1.5 rounded ${result.winnings > 0 ? "bg-green-500" : result.winnings < 0 ? "bg-red-500" : "bg-gray-500"} text-white`}>
                    {result.winnings > 0 ? `+${result.winnings}` : result.winnings}
                </div>
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
    const [currentTurn, setCurrentTurn] = useState<number | string | null>(null);
    const [results, setResults] = useState<any[] | null>(null);
    const [turnStartTime, setTurnStartTime] = useState<number | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number>(30);
    const [dealerId, setDealerId] = useState<number | null>(null);

    const game = GAMES.find(g => g.id === gameType);
    const tableIdNum = parseInt(tableId || "0");
    const isOwner = table?.createdById === currentUser?.id;
    const isDealer = dealerId === currentUser?.id;
    const isMyTurn = currentTurn === currentUser?.id;
    const isWaiting = table?.status === "waiting";
    const isPlaying = table?.status === "playing";
    const isFinished = table?.status === "finished";

    const loadTable = useCallback(async () => {
        if (!gameType || !tableId || isNaN(tableIdNum) || tableIdNum <= 0) { setLoading(false); return; }
        try {
            const data = await getTable(gameType, tableIdNum);
            setTable(data);
            setDealerId(data.dealerId);
            if (data.gameState) {
                const gs = JSON.parse(data.gameState);
                setCurrentTurn(gs.currentTurn);
                setTurnStartTime(gs.turnStartTime || null);
                if (gs.results) setResults(gs.results);
                if (gs.dealerId) setDealerId(gs.dealerId);
            }
            const myPart = data.participants.find((p: Participant) => p.userId === currentUser?.id);
            if (myPart?.handState) setMyHand(JSON.parse(myPart.handState));
            if (myPart?.currentBet) setBetAmount(myPart.currentBet.toString());
        } catch (error) { console.error("Failed to load table:", error); }
        finally { setLoading(false); }
    }, [gameType, tableId, tableIdNum, currentUser?.id]);

    useEffect(() => { loadTable(); const i = setInterval(loadTable, 2000); return () => clearInterval(i); }, [loadTable]);

    useEffect(() => {
        if (!turnStartTime || !isPlaying || isNaN(tableIdNum) || tableIdNum <= 0) { setTimeRemaining(30); return; }
        const update = () => {
            const r = Math.max(0, Math.ceil((TURN_TIMEOUT_MS - (Date.now() - turnStartTime)) / 1000));
            setTimeRemaining(r);
            if (r === 0) checkTimeout(tableIdNum).then(res => { if (res.timedOut) { toast.info("Hết giờ!"); loadTable(); } }).catch(() => { });
        };
        update(); const i = setInterval(update, 1000); return () => clearInterval(i);
    }, [turnStartTime, isPlaying, tableIdNum, loadTable]);

    const handleLeave = async () => { setActionLoading(true); try { await leaveTable(tableIdNum); toast.success("Đã rời"); navigate(`/games/${gameType}`); } catch (e: any) { toast.error(e.response?.data?.error || "Lỗi"); } finally { setActionLoading(false); } };
    const handleBet = async () => { const a = parseInt(betAmount); if (isNaN(a) || a < 10) { toast.error("Min 10"); return; } if (a > credit) { toast.error("Thiếu credit"); return; } setActionLoading(true); try { await placeBet(tableIdNum, a); toast.success("OK"); loadTable(); } catch (e: any) { toast.error(e.response?.data?.error || "Lỗi"); } finally { setActionLoading(false); } };
    const handleStart = async () => { setActionLoading(true); try { await startGame(tableIdNum); toast.success("Bắt đầu!"); loadTable(); } catch (e: any) { toast.error(e.response?.data?.error || "Lỗi"); } finally { setActionLoading(false); } };
    const handleHit = async () => { setActionLoading(true); try { const r = await hit(tableIdNum); setMyHand(r.hand); setCurrentTurn(r.currentTurn); if (r.hand.isBusted) toast.error("Quắc!"); loadTable(); } catch (e: any) { toast.error(e.response?.data?.error || "Lỗi"); } finally { setActionLoading(false); } };
    const handleStand = async () => { setActionLoading(true); try { const r = await stand(tableIdNum); if (r.finished) { setResults(r.results); refreshCredit(); toast.success("Xong!"); } loadTable(); } catch (e: any) { toast.error(e.response?.data?.error || "Lỗi"); } finally { setActionLoading(false); } };
    const handlePlayAgain = async () => { setActionLoading(true); try { await playAgain(tableIdNum); toast.success("Ván mới!"); setMyHand(null); setResults(null); loadTable(); } catch (e: any) { toast.error(e.response?.data?.error || "Lỗi"); } finally { setActionLoading(false); } };
    const handleTransferDealer = async (id: number) => { setActionLoading(true); try { await transferDealer(tableIdNum, id); toast.success("Đã chuyển cái"); loadTable(); } catch (e: any) { toast.error(e.response?.data?.error || "Lỗi"); } finally { setActionLoading(false); } };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!table) return <div className="text-center py-10"><p>Bàn không tồn tại</p><Button variant="outline" onClick={() => navigate(`/games/${gameType}`)} className="mt-4"><ArrowLeft className="h-4 w-4 mr-2" />Quay lại</Button></div>;

    const joinedPlayers = table.participants.filter(p => p.status === "joined");
    const myResult = results?.find(r => r.userId === currentUser?.id);
    const canIStand = myHand && (myHand.score >= 16 || myHand.isBlackjack || myHand.isDoubleAce || myHand.isFiveCard || myHand.isBusted);

    const dealerPlayer = joinedPlayers.find(p => p.userId === dealerId);
    const me = joinedPlayers.find(p => p.userId === currentUser?.id);
    const others = joinedPlayers.filter(p => p.userId !== dealerId && p.userId !== currentUser?.id);

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-gray-900">
            {/* Compact Header */}
            <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/games/${gameType}`)}><ArrowLeft className="h-4 w-4" /></Button>
                <div className="flex-1">
                    <h2 className="text-sm font-bold">{game?.icon} {table.name}</h2>
                    <p className="text-[10px] text-gray-400">{joinedPlayers.length}p • {isWaiting ? "Chờ" : isPlaying ? "Chơi" : "Xong"}</p>
                </div>
                <div className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded"><Coins className="h-3 w-3" />{credit}</div>
                {!isPlaying && <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={handleLeave} disabled={actionLoading}><LogOut className="h-4 w-4" /></Button>}
            </div>

            {/* Compact Game Table */}
            <div className="flex-1 relative bg-gradient-radial from-green-800 to-green-900 m-2 rounded-xl overflow-hidden">
                {/* Table felt */}
                <div className="absolute inset-3 rounded-full border-2 border-green-600/40 bg-green-700/20" />

                {/* Dealer at top */}
                {dealerPlayer && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
                        <PlayerSeat participant={dealerPlayer} isCurrentTurn={currentTurn === dealerPlayer.userId} isMe={dealerPlayer.userId === currentUser?.id} isDealer hideCards={false} showResult={isFinished} result={results?.find(r => r.userId === dealerPlayer.userId)} compact />
                    </div>
                )}

                {/* Others on sides */}
                {others.length > 0 && (
                    <div className="absolute top-1/4 left-2 right-2 flex justify-between z-10">
                        {others.slice(0, 3).map(p => (
                            <PlayerSeat key={p.id} participant={p} isCurrentTurn={currentTurn === p.userId} isMe={false} isDealer={false} hideCards={isPlaying} showResult={isFinished} result={results?.find(r => r.userId === p.userId)} onTransferDealer={isWaiting && (isOwner || isDealer) ? () => handleTransferDealer(p.userId) : undefined} compact />
                        ))}
                    </div>
                )}

                {/* Me at bottom (if not dealer) */}
                {me && me.userId !== dealerId && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
                        <PlayerSeat participant={me} isCurrentTurn={isMyTurn} isMe isDealer={false} hideCards={false} showResult={isFinished} result={myResult} />
                    </div>
                )}

                {/* Timer */}
                {isMyTurn && isPlaying && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-bold ${timeRemaining <= 10 ? "bg-red-500 animate-pulse" : "bg-yellow-500"} text-black`}>
                            <Timer className="h-3 w-3" />{timeRemaining}
                        </div>
                    </div>
                )}

                {/* Actions */}
                {isMyTurn && isPlaying && myHand && !myHand.isBusted && myHand.cards.length < 5 && (
                    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                        <Button onClick={handleHit} disabled={actionLoading} size="sm" className="bg-blue-600 h-8 px-3 text-xs"><Hand className="h-3 w-3 mr-1" />Rút</Button>
                        <Button variant="secondary" onClick={handleStand} disabled={actionLoading || !canIStand} size="sm" className="h-8 px-3 text-xs"><Square className="h-3 w-3 mr-1" />Dừng</Button>
                    </div>
                )}

                {/* Result overlay */}
                {isFinished && myResult && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
                        <Card className={`${myResult.winnings > 0 ? "bg-green-900" : myResult.winnings < 0 ? "bg-red-900" : "bg-gray-800"} border-none`}>
                            <CardContent className="p-4 text-center text-white">
                                <p className="text-xl font-bold">{myResult.description}</p>
                                <p className="text-lg">{myResult.winnings > 0 ? <span className="text-green-400">+{myResult.winnings}</span> : myResult.winnings < 0 ? <span className="text-red-400">{myResult.winnings}</span> : "Hòa"}</p>
                                <div className="flex gap-2 mt-3 justify-center">
                                    {isOwner ? (<><Button size="sm" onClick={handlePlayAgain} disabled={actionLoading}><RotateCcw className="h-3 w-3 mr-1" />Tiếp</Button><Button size="sm" variant="destructive" onClick={handleLeave} disabled={actionLoading}><LogOut className="h-3 w-3 mr-1" />Giải tán</Button></>) : (<Button size="sm" onClick={handleLeave} disabled={actionLoading}><LogOut className="h-3 w-3 mr-1" />Rời</Button>)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Betting panel */}
            {isWaiting && !isDealer && (
                <div className="p-2 bg-gray-800 border-t border-gray-700">
                    <div className="flex gap-1 items-center">
                        <Input type="number" min="10" value={betAmount} onChange={e => setBetAmount(e.target.value)} className="w-16 h-8 text-center text-sm" />
                        {[50, 100, 200].map(a => <Button key={a} variant="outline" size="sm" onClick={() => setBetAmount(a.toString())} className="text-xs h-8 px-2">{a}</Button>)}
                        <Button size="sm" onClick={handleBet} disabled={actionLoading} className="h-8"><Coins className="h-3 w-3 mr-1" />Đặt</Button>
                        <div className="flex-1" />
                        {isOwner && <Button size="sm" onClick={handleStart} disabled={actionLoading} className="h-8"><Play className="h-3 w-3 mr-1" />Bắt đầu</Button>}
                    </div>
                </div>
            )}
            {isWaiting && isDealer && (
                <div className="p-2 bg-yellow-900/30 border-t border-yellow-700 text-center">
                    <span className="text-yellow-400 text-sm font-bold">🎰 Bạn là NHÀ CÁI</span>
                    {isOwner && <Button size="sm" onClick={handleStart} disabled={actionLoading} className="ml-4 h-7"><Play className="h-3 w-3 mr-1" />Bắt đầu</Button>}
                </div>
            )}
        </div>
    );
}
