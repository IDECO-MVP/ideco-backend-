import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../events';
import {
    savePodMessage,
    getPodMessages,
    markPodMessagesRead,
    getPodUnreadCount,
    isPodMember,
} from '../../modules/chat/chat.service';

/**
 * Registers all Workspace Pod socket event handlers for a connected socket.
 */
export const registerPodHandlers = (io: Server, socket: Socket) => {
    const userId: number = (socket as any).userId;

    // ─── Join a pod room ──────────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.POD_JOIN, async ({ podId }: { podId: number }) => {
        try {
            if (!podId) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: 'podId is required to join a pod' });
                return;
            }
            const member = await isPodMember(podId, userId);
            if (!member) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: 'You are not a member of this workspace pod' });
                return;
            }

            const room = `pod:${podId}`;
            socket.join(room);
        } catch (err: any) {
            console.error('[Socket] POD_JOIN error:', err.message);
            socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to join pod' });
        }
    });

    // ─── Leave a pod room ─────────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.POD_LEAVE, ({ podId }: { podId: number }) => {
        const room = `pod:${podId}`;
        socket.leave(room);
    });

    // ─── Send a message to a pod ──────────────────────────────────────────────
    socket.on(
        SOCKET_EVENTS.POD_SEND_MESSAGE,
        async ({ podId, content }: { podId: number; content: string }) => {
            try {
                if (!content || !content.trim()) {
                    socket.emit(SOCKET_EVENTS.ERROR, { message: 'Message content cannot be empty' });
                    return;
                }

                const member = await isPodMember(podId, userId);
                if (!member) {
                    socket.emit(SOCKET_EVENTS.ERROR, { message: 'You are not a member of this workspace pod' });
                    return;
                }

                const message = await savePodMessage(podId, userId, content.trim());

                // Broadcast to everyone in the pod room (including sender)
                io.to(`pod:${podId}`).emit(SOCKET_EVENTS.POD_NEW_MESSAGE, { message });
            } catch (err: any) {
                console.error('[Socket] POD_SEND_MESSAGE error:', err.message);
                socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to send pod message' });
            }
        }
    );

    // ─── Request message history ──────────────────────────────────────────────
    socket.on(
        SOCKET_EVENTS.POD_GET_HISTORY,
        async ({ podId, page = 1, limit = 50 }: { podId: number; page?: number; limit?: number }) => {
            try {
                const member = await isPodMember(podId, userId);
                if (!member) {
                    socket.emit(SOCKET_EVENTS.ERROR, { message: 'You are not a member of this workspace pod' });
                    return;
                }

                const data = await getPodMessages(podId, page, limit);
                socket.emit(SOCKET_EVENTS.POD_HISTORY, { podId, ...data });
            } catch (err: any) {
                console.error('[Socket] POD_GET_HISTORY error:', err.message);
                socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to fetch pod history' });
            }
        }
    );

    // ─── Mark messages as read ────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.POD_MARK_READ, async ({ podId }: { podId: number }) => {
        try {
            await markPodMessagesRead(podId, userId);
            const unreadCount = await getPodUnreadCount(podId, userId);
            // Notify only the user who marked
            socket.emit(SOCKET_EVENTS.POD_UNREAD_COUNT, { podId, unreadCount });
        } catch (err: any) {
            console.error('[Socket] POD_MARK_READ error:', err.message);
            socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to mark pod messages as read' });
        }
    });

    // ─── Typing indicator ─────────────────────────────────────────────────────
    socket.on(
        SOCKET_EVENTS.POD_TYPING,
        ({ podId, isTyping }: { podId: number; isTyping: boolean }) => {
            socket.to(`pod:${podId}`).emit(SOCKET_EVENTS.POD_TYPING_BROADCAST, {
                podId,
                userId,
                isTyping,
            });
        }
    );
};
