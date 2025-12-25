import { Outlet } from "react-router-dom";
import { GamesProvider } from "@/context/GamesContext";
import { GamesFooter } from "@/components/games/GamesFooter";
import { useCheatcode } from "@/hooks/useCheatcode";
import { useGames } from "@/context/GamesContext";

// Inner component to use the context
function GamesLayoutInner() {
    const { triggerCheat } = useGames();

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
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
                    <span className="text-2xl">🎮</span>
                    <h1 className="text-xl font-bold text-foreground">Games</h1>
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
