import { useAuth } from "@/hooks/useAuth";
import { useGames } from "@/context/GamesContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Coins } from "lucide-react";

export function GamesFooter() {
    const { currentUser } = useAuth();
    const { credit, loading } = useGames();

    if (!currentUser) return null;

    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border px-4 py-3 z-50">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
                {/* User Info */}
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-primary/30">
                        <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name || currentUser.username} />
                        <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                            {(currentUser.name || currentUser.username || "?")[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground">
                            {currentUser.name || currentUser.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            @{currentUser.username}
                        </span>
                    </div>
                </div>

                {/* Credit Display */}
                <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-4 py-2 rounded-full border border-yellow-500/30">
                    <Coins className="h-5 w-5 text-yellow-500" />
                    <span className="font-bold text-lg text-yellow-500">
                        {loading ? "..." : credit.toLocaleString()}
                    </span>
                </div>
            </div>
        </footer>
    );
}
