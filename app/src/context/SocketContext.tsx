import React, { createContext, useContext, useEffect, ReactNode, useRef } from 'react';
import { socketService } from '../services/socketService';
import { useAuth } from './AuthContext';

interface SocketContextType {
    subscribe: (event: string, callback: (...args: any[]) => void) => () => void;
    emit: (event: string, data?: any) => void;
    isConnected: () => boolean;
}

const SocketContext = createContext<SocketContextType>({} as SocketContextType);

interface SocketProviderProps {
    children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
    const { user } = useAuth();
    const connectedRef = useRef(false);

    useEffect(() => {
        if (user && !connectedRef.current) {
            console.log('[SocketContext] User logged in, connecting socket...');
            socketService.connect();
            connectedRef.current = true;
        } else if (!user && connectedRef.current) {
            console.log('[SocketContext] User logged out, disconnecting socket...');
            socketService.disconnect();
            connectedRef.current = false;
        }

        return () => {
            // Cleanup on unmount
            if (connectedRef.current) {
                socketService.disconnect();
                connectedRef.current = false;
            }
        };
    }, [user]);

    const subscribe = (event: string, callback: (...args: any[]) => void) => {
        return socketService.on(event, callback);
    };

    const emit = (event: string, data?: any) => {
        socketService.emit(event, data);
    };

    const isConnected = () => socketService.isConnected();

    return (
        <SocketContext.Provider value={{ subscribe, emit, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
