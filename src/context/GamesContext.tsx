import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { getCredits, applyCheatcode } from "@/services/gamesService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface GamesContextType {
    credit: number;
    loading: boolean;
    refreshCredit: () => Promise<void>;
    triggerCheat: () => Promise<void>;
}

const GamesContext = createContext<GamesContextType | null>(null);

export function GamesProvider({ children }: { children: ReactNode }) {
    const { currentUser } = useAuth();
    const [credit, setCredit] = useState(0);
    const [loading, setLoading] = useState(true);

    const refreshCredit = useCallback(async () => {
        if (!currentUser) return;
        try {
            const data = await getCredits();
            setCredit(data.credit);
        } catch (error) {
            console.error("Failed to fetch credits:", error);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    const triggerCheat = useCallback(async () => {
        try {
            const data = await applyCheatcode();
            setCredit(data.credit);
            toast.success(`💰 Cheatcode activated! +${data.added} credits`, {
                description: `Balance: ${data.credit} credits`
            });
        } catch (error) {
            console.error("Cheat failed:", error);
            toast.error("Cheat failed!");
        }
    }, []);

    useEffect(() => {
        refreshCredit();
    }, [refreshCredit]);

    return (
        <GamesContext.Provider value={{ credit, loading, refreshCredit, triggerCheat }}>
            {children}
        </GamesContext.Provider>
    );
}

export function useGames() {
    const context = useContext(GamesContext);
    if (!context) {
        throw new Error("useGames must be used within a GamesProvider");
    }
    return context;
}
