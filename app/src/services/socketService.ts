import { io, Socket } from 'socket.io-client';
import { BASE_URL } from '../config/constants';
import { authService } from './authService';

let socket: Socket | null = null;

// Event listeners storage
type EventCallback = (...args: any[]) => void;
const listeners: Map<string, Set<EventCallback>> = new Map();

export const socketService = {
    // Connect to socket server with authentication
    connect: async () => {
        if (socket?.connected) {
            console.log('[Socket] Already connected');
            return;
        }

        const token = await authService.getToken();
        if (!token) {
            console.log('[Socket] No token, cannot connect');
            return;
        }

        socket = io(BASE_URL, {
            auth: { token, clientType: 'mobile' },
            query: { clientType: 'mobile' },
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket?.id);
        });

        socket.on('disconnect', (reason) => {
            console.log('[Socket] Disconnected:', reason);
        });

        socket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error.message);
        });

        // Re-emit to registered listeners
        socket.onAny((event, ...args) => {
            const eventListeners = listeners.get(event);
            if (eventListeners) {
                eventListeners.forEach(cb => cb(...args));
            }
        });

        return socket;
    },

    // Disconnect from socket
    disconnect: () => {
        if (socket) {
            socket.disconnect();
            socket = null;
            console.log('[Socket] Manually disconnected');
        }
    },

    // Subscribe to an event
    on: (event: string, callback: EventCallback) => {
        if (!listeners.has(event)) {
            listeners.set(event, new Set());
        }
        listeners.get(event)!.add(callback);

        // If already connected, set up direct listener too
        if (socket?.connected) {
            socket.on(event, callback);
        }

        // Return unsubscribe function
        return () => {
            listeners.get(event)?.delete(callback);
            socket?.off(event, callback);
        };
    },

    // Emit an event
    emit: (event: string, data?: any) => {
        if (socket?.connected) {
            socket.emit(event, data);
        } else {
            console.warn('[Socket] Not connected, cannot emit:', event);
        }
    },

    // Check if connected
    isConnected: () => socket?.connected ?? false,

    // Get socket instance
    getSocket: () => socket,
};
