import { Outlet, useNavigate } from "react-router-dom";
import { GamesProvider } from "@/context/GamesContext";
import { GamesFooter } from "@/components/games/GamesFooter";
import { useCheatcode } from "@/hooks/useCheatcode";
import { useGames } from "@/context/GamesContext";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

// Inner component to use the context
function GamesLayoutInner() {
    const { triggerCheat } = useGames();
    const navigate = useNavigate();

    // Listen for cheatcode "givememoney"
    useCheatcode({
        code: "givememoney",
        maxInterval: 500,
        onTrigger: triggerCheat
    });

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/")}
                        className="h-9 w-9 text-muted-foreground hover:text-foreground"
                        title="Về TeamHub"
                    >
                        <Home className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2 flex-1">
                        <span className="text-2xl">🎮</span>
                        <h1 className="text-xl font-bold text-foreground">Games</h1>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-6">
                <Outlet />
            </main>

            {/* Footer with user info and credits */}
            <GamesFooter />
        </div>
    );
}

export function GamesLayout() {
    return (
        <GamesProvider>
            <GamesLayoutInner />
        </GamesProvider>
    );
}
