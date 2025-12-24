import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useGames } from "@/context/GamesContext";
import { toast } from "sonner";

export function CounterPage() {
    const navigate = useNavigate();
    const { credit, refreshCredit } = useGames();
    const [count, setCount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(10);
    const [isPlaying, setIsPlaying] = useState(false);
    const [bestScore, setBestScore] = useState(() => {
        const saved = localStorage.getItem("counter_best");
        return saved ? parseInt(saved) : 0;
    });

    const betAmount = 10;
    const rewardPerClick = 1;

    // Timer effect
    useEffect(() => {
        if (!isPlaying) return;

        if (timeLeft <= 0) {
            endGame();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((t) => t - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isPlaying, timeLeft]);

    const startGame = () => {
        if (credit < betAmount) {
            toast.error("Không đủ credit để chơi!");
            return;
        }
        setCount(0);
        setTimeLeft(10);
        setIsPlaying(true);
        toast.info(`Đã cược ${betAmount} credits. Bắt đầu!`);
    };

    const endGame = useCallback(() => {
        setIsPlaying(false);
        const reward = Math.floor(count * rewardPerClick);

        if (count > bestScore) {
            setBestScore(count);
            localStorage.setItem("counter_best", count.toString());
            toast.success(`🎉 Kỷ lục mới! ${count} clicks!`, {
                description: `Thưởng: ${reward} credits`
            });
        } else {
            toast.success(`Kết thúc! ${count} clicks`, {
                description: `Thưởng: ${reward} credits`
            });
        }
        refreshCredit();
    }, [count, bestScore, refreshCredit]);

    const handleClick = () => {
        if (!isPlaying) return;
        setCount((c) => c + 1);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/games")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <span className="text-2xl">👆</span>
                        Đếm Nút
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Click nhiều nhất có thể trong 10 giây!
                    </p>
                </div>
            </div>

            {/* Game Area */}
            <Card className="overflow-hidden">
                <CardContent className="p-8 flex flex-col items-center">
                    {/* Timer & Score */}
                    <div className="flex justify-between w-full mb-8 text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Thời gian</p>
                            <p className={`text-4xl font-bold ${timeLeft <= 3 && isPlaying ? 'text-destructive animate-pulse' : ''}`}>
                                {timeLeft}s
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Clicks</p>
                            <p className="text-4xl font-bold text-primary">{count}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Kỷ lục</p>
                            <p className="text-4xl font-bold text-yellow-500">{bestScore}</p>
                        </div>
                    </div>

                    {/* Click Button */}
                    {isPlaying ? (
                        <button
                            onClick={handleClick}
                            className="w-48 h-48 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-6xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-transform select-none"
                        >
                            {count}
                        </button>
                    ) : (
                        <div className="space-y-4 text-center">
                            <p className="text-muted-foreground">
                                Cược: {betAmount} credits | Thưởng: {rewardPerClick}/click
                            </p>
                            <Button
                                size="lg"
                                onClick={startGame}
                                className="px-8 py-6 text-lg"
                            >
                                <RotateCcw className="h-5 w-5 mr-2" />
                                Bắt đầu ({betAmount} credits)
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
