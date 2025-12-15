import React, { createContext, useContext, useState, useEffect } from 'react';
import { themes, ThemeConfig, getThemeById } from '@/config/themeEventsConfig';
import { getGlobalTheme, updateGlobalTheme } from '@/services/api';
import { useAuth } from './AuthContext';

interface ThemeEventContextType {
    currentThemeId: string;
    currentTheme: ThemeConfig;
    setTheme: (id: string) => void;
    availableThemes: ThemeConfig[];
}

const ThemeEventContext = createContext<ThemeEventContextType | undefined>(undefined);

export function ThemeEventProvider({ children }: { children: React.ReactNode }) {
    const [currentThemeId, setCurrentThemeId] = useState<string>('default');
    const { socket } = useAuth();

    // 1. Initial Load from API
    useEffect(() => {
        const loadTheme = async () => {
            try {
                const data = await getGlobalTheme();
                if (data && data.themeId && getThemeById(data.themeId)) {
                    console.log("Client loaded global theme:", data.themeId);
                    setCurrentThemeId(data.themeId);
                }
            } catch (error) {
                console.error("Failed to load global theme", error);
            }
        };
        loadTheme();
    }, []);

    // 2. Listen for Socket Updates
    useEffect(() => {
        if (!socket) return;

        const handleThemeUpdate = (data: { themeId: string }) => {
            if (data && data.themeId && getThemeById(data.themeId)) {
                setCurrentThemeId(data.themeId);
            }
        };

        socket.on('theme:updated', handleThemeUpdate);

        return () => {
            socket.off('theme:updated', handleThemeUpdate);
        };
    }, [socket]);

    const setTheme = async (id: string) => {
        // Optimistic update
        setCurrentThemeId(id);

        try {
            await updateGlobalTheme(id);
        } catch (error) {
            console.error("Failed to update global theme", error);
        }
    };

    const currentTheme = getThemeById(currentThemeId) || themes[0];

    return (
        <ThemeEventContext.Provider value={{
            currentThemeId,
            currentTheme,
            setTheme,
            availableThemes: themes
        }}>
            {children}
        </ThemeEventContext.Provider>
    );
}

export function useThemeEvent() {
    const context = useContext(ThemeEventContext);
    if (context === undefined) {
        throw new Error('useThemeEvent must be used within a ThemeEventProvider');
    }
    return context;
}
