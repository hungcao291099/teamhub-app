import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ArrowLeft, LogOut, Hand, Square, Loader2, Coins, Timer, RotateCcw, Sparkles } from "lucide-react";
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
                className={`w-10 h-14 bg-gradient-to-br from-red-700 via-red-800 to-red-900 rounded-lg border-2 border-amber-500/50 flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.5)] text-xl font-black text-amber-500/30 ${animate ? 'card-deal' : ''}`}
                style={{ animationDelay: `${delay}s`, transform: 'rotate(-2deg)' }}
            >
                🂠
            </div>
        );
    }

    const suitSymbol = getSuitSymbol(card.suit);
    const color = getSuitColor(card.suit);

    return (
        <div
            className={`w-10 h-14 bg-white rounded-lg border-2 border-gray-200 flex flex-col items-center justify-between py-1.5 shadow-[0_4px_10px_rgba(0,0,0,0.3)] transition-transform duration-300 ${animate ? 'card-deal' : ''}`}
            style={{ animationDelay: `${delay}s` }}
        >
            <span className={`text-xs font-black leading-none self-start ml-1.5 ${color}`}>{card.rank}</span>
            <span className={`text-lg leading-none ${color}`}>{suitSymbol}</span>
            <span className={`text-[8px] font-black leading-none self-end mr-1.5 rotate-180 ${color}`}>{card.rank}</span>
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
    const size = compact ? "h-10 w-10" : "h-14 w-14";

    return (
        <div className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-500 relative ${isCurrentTurn ? "bg-amber-500/20 ring-2 ring-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse" :
            isMe ? "bg-blue-500/10 ring-1 ring-blue-500/30" : "bg-black/40 backdrop-blur-sm border border-white/5"
            }`}>
            <div className="relative">
                <Avatar className={`${size} border-2 ${isDealer ? "border-yellow-500" : isCurrentTurn ? "border-amber-400" : isMe ? "border-blue-400" : "border-white/20"} shadow-xl`}>
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback className="text-xs bg-gray-800 text-gray-300">{(user?.name || user?.username || "?")[0]}</AvatarFallback>
                </Avatar>
                {isDealer && <div className="absolute -top-1 -right-1 bg-yellow-500 text-black p-0.5 rounded-full shadow-lg"><Sparkles className="h-3 w-3" /></div>}
            </div>

            <p className={`text-[10px] font-bold truncate max-w-[70px] ${isMe ? "text-blue-300" : "text-gray-200"}`}>{user?.name || user?.username}</p>

            {!isDealer && participant.currentBet > 0 && (
                <div className="absolute -bottom-2 flex items-center gap-0.5 bg-gradient-to-r from-amber-400 to-amber-600 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg border border-white/20">
                    <Coins className="h-2.5 w-2.5" />{participant.currentBet.toLocaleString()}
                </div>
            )}

            {onTransferDealer && !isDealer && (
                <Button size="sm" variant="ghost" className="absolute -top-1 -left-1 h-5 w-5 p-0 bg-yellow-500 text-black hover:bg-yellow-400 rounded-full" onClick={onTransferDealer}>
                    <RotateCcw className="h-3 w-3" />
                </Button>
            )}

            {hand && hand.cards && hand.cards.length > 0 && (
                <div className={`flex gap-0.5 -space-x-3 mt-1 hover:-space-x-1 transition-all duration-300 ${compact ? "scale-90" : "scale-100"}`}>
                    {hand.cards.map((card, i) => (
                        <div key={i} className="playing-card-container">
                            <PlayingCard card={card} hidden={hideCards && !isMe && !isDealer} index={i} animate />
                        </div>
                    ))}
                </div>
            )}

            {hand && (!hideCards || isMe || isDealer) && (
                <div className={`mt-1 text-xs font-black px-2 py-0.5 rounded shadow-lg ${hand.isBusted ? "bg-red-600 text-white" :
                    hand.isBlackjack || hand.isDoubleAce ? "bg-yellow-500 text-black animate-bounce" :
                        hand.isFiveCard ? "bg-emerald-500 text-white" : "bg-white/10 text-white border border-white/10"
                    }`}>
                    {hand.score}
                    {hand.isBlackjack && " XD"}
                    {hand.isDoubleAce && " XB"}
                    {hand.isFiveCard && " NL"}
                    {hand.isBusted && " Q"}
                </div>
            )}

            {showResult && result && !isDealer && (
                <div className={`absolute -top-1 -right-4 text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xl z-40 transform rotate-12 animate-in fade-in zoom-in duration-500 ${result.winnings > 0 ? "bg-green-500 text-white font-bold" : result.winnings < 0 ? "bg-red-500 text-white font-bold" : "bg-gray-500 text-white"
                    }`}>
                    {result.winnings > 0 ? `+${result.winnings.toLocaleString()}` : result.winnings.toLocaleString()}
                </div>
            )}
        </div>
    );
}

export function BlackjackGamePage() {
    const { gameType, tableId } = useParams();
    const navigate = useNavigate();
    const { credit, refreshCredit } = useGames();
    const { currentUser, socket } = useAuth();

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
    const [isDealing, setIsDealing] = useState(false);
    const [instantWin, setInstantWin] = useState<{ type: 'player' | 'dealer'; description: string } | null>(null);

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

    // Socket listener for game finished events (when another player's action ends the game)
    useEffect(() => {
        if (!socket || !tableIdNum) return;

        const handleGameFinished = (data: { tableId: number; results: any[]; dealerInstantWin?: boolean }) => {
            if (data.tableId === tableIdNum) {
                setResults(data.results);
                refreshCredit();
                // Check for dealer instant win
                if (data.dealerInstantWin) {
                    const dealerResult = data.results?.find((r: any) => r.isDealer);
                    setInstantWin({ type: 'dealer', description: dealerResult?.description || 'Nhà cái thắng trắng!' });
                }
                loadTable();
            }
        };

        socket.on("games:game_finished", handleGameFinished);
        return () => { socket.off("games:game_finished", handleGameFinished); };
    }, [socket, tableIdNum, refreshCredit, loadTable]);

    // Socket listener for game started events (trigger dealing animation)
    useEffect(() => {
        if (!socket || !tableIdNum) return;

        const handleGameStarted = (data: { tableId: number }) => {
            if (data.tableId === tableIdNum) {
                setIsDealing(true);
                setInstantWin(null); // Clear any previous instant win
                setResults(null); // Clear previous results
                setTimeout(() => setIsDealing(false), 1500); // Animation duration
                loadTable();
            }
        };

        socket.on("games:game_started", handleGameStarted);
        return () => { socket.off("games:game_started", handleGameStarted); };
    }, [socket, tableIdNum, loadTable]);

    const handleLeave = async () => { setActionLoading(true); try { await leaveTable(tableIdNum); toast.success("Đã rời"); navigate(`/games/${gameType}`); } catch (e: any) { toast.error(e.response?.data?.error || "Lỗi"); } finally { setActionLoading(false); } };
    const handleBet = async () => { const a = parseInt(betAmount); if (isNaN(a) || a < 10) { toast.error("Min 10"); return; } if (a > credit) { toast.error("Thiếu credit"); return; } setActionLoading(true); try { await placeBet(tableIdNum, a); toast.success("Đã đặt cược!"); loadTable(); } catch (e: any) { toast.error(e.response?.data?.error || "Lỗi"); } finally { setActionLoading(false); } };
    const handleStart = async () => { setActionLoading(true); try { await startGame(tableIdNum); toast.success("Khai xuân!"); loadTable(); } catch (e: any) { toast.error(e.response?.data?.error || "Lỗi"); } finally { setActionLoading(false); } };
    const handleHit = async () => { setActionLoading(true); try { const r = await hit(tableIdNum); setMyHand(r.hand); setCurrentTurn(r.currentTurn); if (r.hand.isBusted) toast.error("Quắc rồi!"); loadTable(); } catch (e: any) { toast.error(e.response?.data?.error || "Lỗi"); } finally { setActionLoading(false); } };
    const handleStand = async () => { setActionLoading(true); try { const r = await stand(tableIdNum); if (r.finished) { setResults(r.results); refreshCredit(); toast.success("Kết thúc ván!"); } loadTable(); } catch (e: any) { toast.error(e.response?.data?.error || "Lỗi"); } finally { setActionLoading(false); } };
    const handlePlayAgain = async () => { setActionLoading(true); try { await playAgain(tableIdNum); toast.success("Ván mới!"); setMyHand(null); setResults(null); setInstantWin(null); loadTable(); } catch (e: any) { toast.error(e.response?.data?.error || "Lỗi"); } finally { setActionLoading(false); } };
    const handleTransferDealer = async (id: number) => { setActionLoading(true); try { await transferDealer(tableIdNum, id); toast.success("Đã chuyển quyền cầm cái"); loadTable(); } catch (e: any) { toast.error(e.response?.data?.error || "Lỗi"); } finally { setActionLoading(false); } };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-amber-500" /></div>;
    if (!table) return <div className="text-center py-20 bg-gray-900 min-h-screen text-white"><p className="text-xl">Bàn không tồn tại hoặc đã giải tán</p><Button variant="outline" onClick={() => navigate(`/games/${gameType}`)} className="mt-6 border-amber-500 text-amber-500 hover:bg-amber-500/10"><ArrowLeft className="h-5 w-5 mr-2" />Quay lại sảnh</Button></div>;

    const joinedPlayers = table.participants.filter(p => p.status === "joined");
    const myResult = results?.find(r => r.userId === currentUser?.id);
    const canIStand = myHand && (myHand.score >= 16 || myHand.isBlackjack || myHand.isDoubleAce || myHand.isFiveCard || myHand.isBusted);

    const dealerPlayer = joinedPlayers.find(p => p.userId === dealerId);
    const me = joinedPlayers.find(p => p.userId === currentUser?.id);
    const others = joinedPlayers.filter(p => p.userId !== dealerId && p.userId !== currentUser?.id);

    return (
        <div className="flex flex-col h-[calc(100vh-40px)] md:h-[calc(100vh-80px)] bg-gray-950 font-sans select-none overflow-hidden">
            {/* Casino VIP Header */}
            <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-red-950 to-black border-b border-amber-900/50 shadow-2xl z-50">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-200 hover:bg-white/10" onClick={() => navigate(`/games/${gameType}`)}><ArrowLeft className="h-4 w-4" /></Button>
                <div className="flex-1">
                    <h2 className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                        <span>{game?.icon || "🧧"}</span> {table.name}
                    </h2>
                </div>
                <div className="flex items-center gap-2 bg-black/40 border border-amber-500/20 px-2 py-1 rounded-full">
                    <Coins className="h-3 w-3 text-amber-500" />
                    <span className="text-[10px] font-bold text-amber-100">{credit.toLocaleString()}</span>
                </div>
                {!isPlaying && <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-500/10" onClick={handleLeave} disabled={actionLoading}><LogOut className="h-4 w-4" /></Button>}
            </div>

            {/* Casino Gameplay Floor */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                {/* Decorative Background decorations (outside table) */}
                <div className="absolute top-10 left-10 text-6xl opacity-10 pointer-events-none -rotate-12 animate-pulse">🌸</div>
                <div className="absolute top-10 right-10 text-6xl opacity-10 pointer-events-none rotate-12 animate-pulse">🌸</div>
                <div className="absolute bottom-20 left-20 text-4xl opacity-5 pointer-events-none">🧧</div>
                <div className="absolute bottom-20 right-20 text-4xl opacity-5 pointer-events-none">🧧</div>

                {/* The Central Oval Table (Small) */}
                <div className="relative w-[300px] h-[180px] md:w-[500px] md:h-[280px] rounded-[100%] border-8 border-amber-900/40 shadow-[0_0_100px_rgba(0,0,0,0.5),inset_0_0_50px_rgba(0,0,0,0.5)] bg-green-900 felt-pattern z-0 flex items-center justify-center group">
                    <div className="absolute inset-4 rounded-[100%] border-2 border-emerald-800/20 shadow-inner" />

                    {/* Phrases on Table */}
                    <div className="text-[8px] md:text-[10px] font-black text-amber-200/5 uppercase tracking-[0.3em] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        BLACKJACK PAYS 3 TO 2
                    </div>

                    {/* Central Deck (Dealer's Spot) */}
                    <div className="table-center-deck scale-75 md:scale-100">
                        <div className="text-amber-500/20 font-black text-xs">TEAMHUB</div>
                        {/* Recursive card back for visual effect */}
                        <div className="absolute -top-1 -right-1 w-full h-full bg-red-900/20 border border-amber-500/10 rounded-lg -z-10 translate-x-1 translate-y-1"></div>
                    </div>
                </div>

                {/* Players Positioned Circularly around the center */}

                {/* 1. Dealer (Top Center) */}
                {dealerPlayer && (
                    <div className="absolute top-[5%] left-1/2 -translate-x-1/2 z-20">
                        <PlayerSeat participant={dealerPlayer} isCurrentTurn={currentTurn === dealerPlayer.userId} isMe={dealerPlayer.userId === currentUser?.id} isDealer hideCards={false} showResult={isFinished} result={results?.find(r => r.userId === dealerPlayer.userId)} compact />
                    </div>
                )}

                {/* 2. Other Players (Left and Right Arcs) */}
                {others.length > 0 && (
                    <>
                        {/* Upper Left */}
                        {others[0] && (
                            <div className="absolute top-[20%] left-[5%] md:left-[15%] z-20 scale-90 md:scale-100">
                                <PlayerSeat participant={others[0]} isCurrentTurn={currentTurn === others[0].userId} isMe={false} isDealer={false} hideCards={isPlaying} showResult={isFinished} result={results?.find(r => r.userId === others[0].userId)} onTransferDealer={isWaiting && (isOwner || isDealer) ? () => handleTransferDealer(others[0].userId) : undefined} compact />
                            </div>
                        )}
                        {/* Lower Left */}
                        {others[1] && (
                            <div className="absolute bottom-[25%] left-[5%] md:left-[15%] z-20 scale-90 md:scale-100">
                                <PlayerSeat participant={others[1]} isCurrentTurn={currentTurn === others[1].userId} isMe={false} isDealer={false} hideCards={isPlaying} showResult={isFinished} result={results?.find(r => r.userId === others[1].userId)} onTransferDealer={isWaiting && (isOwner || isDealer) ? () => handleTransferDealer(others[1].userId) : undefined} compact />
                            </div>
                        )}
                        {/* Upper Right */}
                        {others[2] && (
                            <div className="absolute top-[20%] right-[5%] md:right-[15%] z-20 scale-90 md:scale-100">
                                <PlayerSeat participant={others[2]} isCurrentTurn={currentTurn === others[2].userId} isMe={false} isDealer={false} hideCards={isPlaying} showResult={isFinished} result={results?.find(r => r.userId === others[2].userId)} onTransferDealer={isWaiting && (isOwner || isDealer) ? () => handleTransferDealer(others[2].userId) : undefined} compact />
                            </div>
                        )}
                        {/* Lower Right */}
                        {others[3] && (
                            <div className="absolute bottom-[25%] right-[5%] md:right-[15%] z-20 scale-90 md:scale-100">
                                <PlayerSeat participant={others[3]} isCurrentTurn={currentTurn === others[3].userId} isMe={false} isDealer={false} hideCards={isPlaying} showResult={isFinished} result={results?.find(r => r.userId === others[3].userId)} onTransferDealer={isWaiting && (isOwner || isDealer) ? () => handleTransferDealer(others[3].userId) : undefined} compact />
                            </div>
                        )}
                    </>
                )}

                {/* 3. Me (Bottom Center) */}
                {me && me.userId !== dealerId && (
                    <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 z-20 scale-110">
                        <PlayerSeat participant={me} isCurrentTurn={isMyTurn} isMe isDealer={false} hideCards={false} showResult={isFinished} result={myResult} />
                    </div>
                )}

                {/* Floating Timer (Near Center) */}
                {isMyTurn && isPlaying && (
                    <div className="absolute top-[50%] left-1/2 -translate-x-1/2 translate-y-24 md:translate-y-32 z-30">
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border-2 ${timeRemaining <= 10 ? "bg-red-600 border-red-400 animate-bounce" : "bg-black/60 border-amber-500"} shadow-2xl`}>
                            <Timer className={`h-3 w-3 ${timeRemaining <= 10 ? "text-white" : "text-amber-500"}`} />
                            <span className="text-sm font-black text-white">{timeRemaining}</span>
                        </div>
                    </div>
                )}

                {/* Draw/Stand Actions - OVERLAID on table for easy reach */}
                {isMyTurn && isPlaying && myHand && (
                    <div className="absolute bottom-[22%] md:bottom-[30%] left-1/2 -translate-x-1/2 z-40 flex gap-4">
                        {/* Hide HIT when busted or 5 cards */}
                        {!myHand.isBusted && myHand.cards.length < 5 && (
                            <Button onClick={handleHit} disabled={actionLoading} size="default" className="bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-black px-6 py-4 md:py-6 rounded-xl shadow-lg active:translate-y-1 transition-all">
                                <Hand className="h-4 w-4 mr-2" /> RÚT
                            </Button>
                        )}
                        {/* Always show DỪNG when it's my turn */}
                        <Button variant="secondary" onClick={handleStand} disabled={actionLoading || !canIStand} size="default" className="bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-300 hover:to-orange-500 text-white font-black px-6 py-4 md:py-6 rounded-xl shadow-lg active:translate-y-1 transition-all">
                            <Square className="h-4 w-4 mr-2" /> DỪNG
                        </Button>
                    </div>
                )}

                {/* Dealing Animation Overlay */}
                {isDealing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="text-center">
                            <div className="text-6xl mb-4 animate-bounce">🃏</div>
                            <h2 className="text-2xl font-black text-amber-400 uppercase tracking-wider">Đang chia bài...</h2>
                        </div>
                    </div>
                )}

                {/* Instant Win Overlay (Xì Bàn / Xì Dách) */}
                {instantWin && (
                    <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in zoom-in duration-500">
                        <div className="text-center">
                            <div className="text-7xl mb-4 animate-bounce">
                                {instantWin.type === 'dealer' ? '👑' : '🎉'}
                            </div>
                            <h2 className="text-3xl font-black text-amber-400 uppercase tracking-tight mb-2">
                                {instantWin.type === 'dealer' ? 'NHÀ CÁI THẮNG TRẮNG!' : 'THẮNG TRẮNG!'}
                            </h2>
                            <p className="text-xl text-white mb-6">{instantWin.description}</p>
                            {isOwner && (
                                <div className="flex gap-3 justify-center">
                                    <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-bold" onClick={handlePlayAgain} disabled={actionLoading}>
                                        <RotateCcw className="h-4 w-4 mr-2" /> VÁN MỚI
                                    </Button>
                                    <Button size="lg" variant="destructive" onClick={handleLeave} disabled={actionLoading}>
                                        <LogOut className="h-4 w-4 mr-2" /> NGHỈ
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Result High-End Overlay */}
                {isFinished && !instantWin && (myResult || isDealer) && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                        <div className={`relative w-full max-w-[320px] p-1 rounded-3xl bg-gradient-to-b ${isDealer ? "from-yellow-400 to-amber-600" : myResult?.winnings > 0 ? "from-amber-400 to-yellow-600" : myResult?.winnings < 0 ? "from-red-600 to-red-900" : "from-gray-400 to-gray-600"}`}>
                            <Card className="bg-gray-950 border-none rounded-[1.4rem] overflow-hidden">
                                <CardContent className="p-6 text-center flex flex-col items-center gap-3">
                                    <div className="text-4xl mb-1">
                                        {isDealer ? "👑" : myResult?.winnings > 0 ? "🧧" : myResult?.winnings < 0 ? "💸" : "🤝"}
                                    </div>
                                    <h3 className={`text-xl font-black uppercase tracking-tighter ${isDealer ? "text-yellow-400" : myResult?.winnings > 0 ? "text-amber-400" : myResult?.winnings < 0 ? "text-red-500" : "text-gray-400"}`}>
                                        {isDealer ? "KẾT THÚC VÁN" : myResult?.description}
                                    </h3>
                                    <p className="text-3xl font-black text-white">
                                        {isDealer ? "Nhà Cái" : myResult?.winnings > 0 ? `+${myResult.winnings.toLocaleString()}` : myResult?.winnings?.toLocaleString()}
                                    </p>
                                    <div className="flex gap-2 mt-4 w-full">
                                        {isOwner ? (
                                            <>
                                                <Button size="sm" className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold h-10" onClick={handlePlayAgain} disabled={actionLoading}>
                                                    <RotateCcw className="h-3 w-3 mr-1" /> VÁN MỚI
                                                </Button>
                                                <Button size="sm" variant="destructive" className="flex-1 font-bold h-10" onClick={handleLeave} disabled={actionLoading}>
                                                    <LogOut className="h-3 w-3 mr-1" /> NGHỈ
                                                </Button>
                                            </>
                                        ) : (
                                            <Button size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold h-10" onClick={handleLeave} disabled={actionLoading}>
                                                <LogOut className="h-3 w-3 mr-1" /> RỜI BÀI
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>

            {/* Betting Panel - Compact Casino Controlbar */}
            {isWaiting && (
                <div className="bg-black/60 backdrop-blur-md border-t border-amber-900/40 p-3 z-50">
                    <div className="max-w-md mx-auto space-y-3">
                        {!isDealer ? (
                            <>
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black text-amber-500/80 uppercase">Lựa chọn tiền cược</span>
                                    <span className="text-[10px] text-gray-400">Min: 10</span>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {[50, 100, 500, 1000].map(a => (
                                        <Button key={a} variant="outline" size="sm" onClick={() => setBetAmount(a.toString())}
                                            className={`text-[10px] font-bold h-8 bg-black/40 border-white/5 transition-all ${betAmount === a.toString() ? 'border-amber-500 text-amber-500 bg-amber-500/10' : 'text-gray-400'}`}>
                                            {a.toLocaleString()}
                                        </Button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input type="number" value={betAmount} onChange={e => setBetAmount(e.target.value)} className="h-10 bg-black border-white/5 text-amber-500 font-bold text-center text-sm" />
                                    <Button onClick={handleBet} disabled={actionLoading} className="h-10 px-8 bg-amber-500 hover:bg-amber-600 text-black font-black whitespace-nowrap">
                                        ĐẶT CƯỢC
                                    </Button>
                                    {isOwner && (
                                        <Button onClick={handleStart} disabled={actionLoading || joinedPlayers.length < 2} className="h-10 bg-red-600 hover:bg-red-700 text-white font-black">
                                            BẮT ĐẦU
                                        </Button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-between gap-4 py-1 px-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500">
                                        <Sparkles className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-black text-yellow-500 tracking-wider">BẠN ĐANG CẦM CÁI...</span>
                                </div>
                                {isOwner && (
                                    <Button onClick={handleStart} disabled={actionLoading || joinedPlayers.length < 2} className="h-10 px-8 bg-red-600 hover:bg-red-700 text-white font-black rounded-lg shadow-lg">
                                        KHAI XUÂN
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
