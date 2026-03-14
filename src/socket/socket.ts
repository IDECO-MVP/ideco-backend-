import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { registerPodHandlers } from './handlers/pod.handler';
import { registerDmHandlers } from './handlers/dm.handler';
import { SOCKET_EVENTS } from './events';

let io: Server;

/**
 * Initialise the Socket.IO server and attach it to the Express HTTP server.
 * Call once during application boot.
 */
export const initSocket = (httpServer: HttpServer): Server => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
        transports: ['websocket', 'polling'],
        // Ping settings for production reliability
        pingTimeout: 60000,
        pingInterval: 25000,
    });

    // ─── JWT Authentication Middleware ────────────────────────────────────────
    io.use((socket: Socket, next) => {
        const token =
            socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.split(' ')[1];

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
            (socket as any).userId = decoded.id;
            (socket as any).userEmail = decoded.email;
            next();
        } catch (err) {
            return next(new Error('Authentication error: Invalid token'));
        }
    });

    // ─── Connection Handler ───────────────────────────────────────────────────
    io.on(SOCKET_EVENTS.CONNECT, (socket: Socket) => {
        const userId = (socket as any).userId;
        console.log(`[Socket] User ${userId} connected (socket: ${socket.id})`);

        // Each user automatically joins their personal room on connect
        socket.join(`user:${userId}`);

        // Register feature-specific handlers
        registerPodHandlers(io, socket);
        registerDmHandlers(io, socket);

        // ─── Disconnect ───────────────────────────────────────────────────────
        socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
            console.log(`[Socket] User ${userId} disconnected (reason: ${reason})`);
        });

        // ─── Global error handler ─────────────────────────────────────────────
        socket.on('error', (err: Error) => {
            console.error(`[Socket] Error from user ${userId}:`, err.message);
        });
    });

    return io;
};

/**
 * Get the active Socket.IO server instance.
 * Throws if called before initSocket().
 */
export const getIO = (): Server => {
    if (!io) {
        throw new Error('Socket.IO has not been initialised. Call initSocket() first.');
    }
    return io;
};
