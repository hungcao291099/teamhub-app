import React, { useEffect, useState } from "react";
import { Vote, X, Clock, Users } from "lucide-react";
import { useMusic } from "@/context/MusicContext";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const actionNames: Record<string, string> = {
    skip: "Bỏ qua",
    previous: "Quay lại",
    pause: "Tạm dừng",
    stop: "Dừng phát",
    delete: "Xóa"
};

export const VotingOverlay: React.FC = () => {
    const { voteState, submitVote, cancelVote } = useMusic();
    const { currentUser } = useAuth();
    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {
        if (!voteState) {
            setTimeLeft(30);
            return;
        }

        const updateTimer = () => {
            const remaining = Math.max(0, Math.ceil((voteState.expiresAt - Date.now()) / 1000));
            setTimeLeft(remaining);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [voteState]);

    if (!voteState) return null;

    const hasVoted = voteState.votes.includes(currentUser?.id || 0);
    const isInitiator = voteState.initiatorId === currentUser?.id;
    const progress = (voteState.votes.length / voteState.requiredVotes) * 100;

    return (
        <div className={cn(
            "fixed bottom-20 left-1/2 -translate-x-1/2 z-50",
            "w-[90vw] max-w-md p-4 rounded-xl",
            "bg-card border border-border shadow-2xl",
            "animate-in slide-in-from-bottom-5 fade-in duration-300"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                        <Vote className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <p className="font-semibold text-sm">
                            {voteState.initiatorName} muốn {actionNames[voteState.actionType]}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {voteState.songTitle}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{timeLeft}s</span>
                </div>
            </div>

            {/* Progress */}
            <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-3 h-3" />
                        Votes
                    </span>
                    <span className="font-medium">
                        {voteState.votes.length} / {voteState.requiredVotes}
                    </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300 rounded-full"
                        style={{ width: `${Math.min(100, progress)}%` }}
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                {!hasVoted ? (
                    <Button
                        onClick={submitVote}
                        className="flex-1"
                        size="sm"
                    >
                        <Vote className="w-4 h-4 mr-1" />
                        Vote
                    </Button>
                ) : (
                    <div className="flex-1 text-center text-sm text-muted-foreground">
                        ✓ Đã vote
                    </div>
                )}

                {isInitiator && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelVote}
                        className="text-destructive hover:text-destructive"
                    >
                        <X className="w-4 h-4 mr-1" />
                        Hủy
                    </Button>
                )}
            </div>
        </div>
    );
};

export default VotingOverlay;
