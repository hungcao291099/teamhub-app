import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import config from "./config";
import { getMusicState } from "./services/MusicService";

let io: SocketIOServer;

// Track online users (Set of user IDs)
const onlineUsers = new Set<number>();

// Helper to broadcast online users list
const broadcastOnlineUsers = () => {
    if (io) {
        io.emit("users:online", Array.from(onlineUsers));
    }
};

export const initSocket = (httpServer: HttpServer) => {
    io = new SocketIOServer(httpServer, {
        cors: {
            origin: "*", // Adjust for production
            methods: ["GET", "POST"]
        }
    });

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication error"));
        }
        try {
            const payload = jwt.verify(token, config.jwtSecret);
            (socket as any).userId = (payload as any).userId;
            // Get client type from query or auth, default to 'web'
            const clientType = socket.handshake.query.clientType || socket.handshake.auth.clientType || 'web';
            (socket as any).clientType = clientType;

            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket: Socket) => {
        const userId = (socket as any).userId;
        const clientType = (socket as any).clientType;

        console.log(`User connected: ${userId} [${clientType}], Socket: ${socket.id}`);

        // Join user to their own room for targeted events (e.g. force logout, direct updates)
        // Differentiate by clientType to allow 1 Web + 1 App
        socket.join(`user_${userId}_${clientType}`);

        // Track online user
        onlineUsers.add(userId);
        broadcastOnlineUsers();

        // Send current online users to newly connected user
        socket.emit("users:online", Array.from(onlineUsers));

        // Send current music state to newly connected user
        const musicState = getMusicState();
        socket.emit("music:state", musicState);

        // Music: Client requests current state
        socket.on("music:get_state", () => {
            socket.emit("music:state", getMusicState());
        });


        // Chat: Join conversation rooms
        socket.on("chat:join", (conversationId: number) => {
            socket.join(`conversation_${conversationId}`);
            console.log(`User ${userId} joined conversation ${conversationId}`);
        });

        // Chat: Leave conversation room
        socket.on("chat:leave", (conversationId: number) => {
            socket.leave(`conversation_${conversationId}`);
            console.log(`User ${userId} left conversation ${conversationId}`);
        });

        // Chat: Typing indicators
        socket.on("chat:typing_start", ({ conversationId, username }) => {
            socket.to(`conversation_${conversationId}`).emit("chat:typing_start", {
                userId,
                username,
                conversationId
            });
        });

        socket.on("chat:typing_stop", ({ conversationId }) => {
            socket.to(`conversation_${conversationId}`).emit("chat:typing_stop", {
                userId,
                conversationId
            });
        });

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${userId} [${clientType}]`);

            // Check if user has any other connections before removing from online list
            const sockets = io.sockets.sockets;
            let stillConnected = false;
            sockets.forEach((s) => {
                if ((s as any).userId === userId && s.id !== socket.id) {
                    stillConnected = true;
                }
            });

            if (!stillConnected) {
                onlineUsers.delete(userId);
                broadcastOnlineUsers();
            }
        });
    });

    return io;
};

// Export getter for online users
export const getOnlineUsers = () => Array.from(onlineUsers);

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

// Typed events helpers
export const emitUserUpdate = (userId: number, data: any) => {
    if (!io) return;
    // Emit to everyone or just specific rooms?
    // Requirement 1 & 3: Realtime update info + avatar. 
    // Usually, other users need to see this update if they are viewing a list or chat.
    // Simplest: Emit to all authenticated clients "user_updated". Client decides if it cares.
    // Or if scalability matters, emit to relevant rooms. For this app, broadcast is fine or room "global".
    io.emit("user:updated", { userId, ...data });
};

export const emitForceLogout = (userId: number, clientType: string = 'web') => {
    if (!io) return;
    // Emit to the user's personal room for the specific client type
    io.to(`user_${userId}_${clientType}`).emit("auth:force_logout", { reason: "Password reset or Session revoked" });
};
