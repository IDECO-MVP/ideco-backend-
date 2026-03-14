import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../events';
import {
    getOrCreateDmConversation,
    saveDmMessage,
    getDmMessages,
    markDmMessagesRead,
    getTotalDmUnreadCount,
} from '../../modules/chat/chat.service';
import { DirectMessage } from '../../modules/chat/directMessage.model';
import { Op } from 'sequelize';

/**
 * Registers all Direct Message socket event handlers for a connected socket.
 */
export const registerDmHandlers = (io: Server, socket: Socket) => {
    const userId: number = (socket as any).userId;

    // ─── Join personal DM room ────────────────────────────────────────────────
    // Each user has their own room `user:{id}` so they receive incoming DMs
    // regardless of which DM thread they have "open".
    socket.on(SOCKET_EVENTS.DM_JOIN, () => {
        const personalRoom = `user:${userId}`;
        socket.join(personalRoom);
        console.log(`[Socket] User ${userId} joined personal room ${personalRoom}`);
    });

    // ─── Send a DM ────────────────────────────────────────────────────────────
    socket.on(
        SOCKET_EVENTS.DM_SEND_MESSAGE,
        async ({ toUserId, content }: { toUserId: number; content: string }) => {
            try {
                if (!content || !content.trim()) {
                    socket.emit(SOCKET_EVENTS.ERROR, { message: 'Message content cannot be empty' });
                    return;
                }

                if (Number(toUserId) === userId) {
                    socket.emit(SOCKET_EVENTS.ERROR, { message: 'You cannot send a message to yourself' });
                    return;
                }

                const dm = await getOrCreateDmConversation(userId, Number(toUserId));
                const message = await saveDmMessage(dm.id, userId, content.trim());

                // Deliver to sender (for multi-tab support)
                socket.emit(SOCKET_EVENTS.DM_NEW_MESSAGE, { dm, message });

                // Deliver to recipient's personal room
                io.to(`user:${toUserId}`).emit(SOCKET_EVENTS.DM_NEW_MESSAGE, { dm, message });

                // Update unread counts for recipient
                const recipientUnread = await getTotalDmUnreadCount(Number(toUserId));
                io.to(`user:${toUserId}`).emit(SOCKET_EVENTS.DM_UNREAD_COUNT, {
                    totalUnread: recipientUnread,
                });
            } catch (err: any) {
                console.error('[Socket] DM_SEND_MESSAGE error:', err.message);
                socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to send DM' });
            }
        }
    );

    // ─── Request DM history ───────────────────────────────────────────────────
    socket.on(
        SOCKET_EVENTS.DM_GET_HISTORY,
        async ({
            dmId,
            page = 1,
            limit = 50,
        }: {
            dmId: number;
            page?: number;
            limit?: number;
        }) => {
            try {
                // Validate the user is part of this conversation
                const dm = await DirectMessage.findOne({
                    where: {
                        id: dmId,
                        [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
                    },
                });

                if (!dm) {
                    socket.emit(SOCKET_EVENTS.ERROR, { message: 'DM conversation not found' });
                    return;
                }

                const data = await getDmMessages(dmId, page, limit);
                socket.emit(SOCKET_EVENTS.DM_HISTORY, { dmId, ...data });
            } catch (err: any) {
                console.error('[Socket] DM_GET_HISTORY error:', err.message);
                socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to fetch DM history' });
            }
        }
    );

    // ─── Get DM list ──────────────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.DM_GET_LIST, async () => {
        try {
            const { getUserDmList } = await import('../../modules/chat/chat.service');
            const list = await getUserDmList(userId);
            socket.emit(SOCKET_EVENTS.DM_LIST, { conversations: list });
        } catch (err: any) {
            console.error('[Socket] DM_GET_LIST error:', err.message);
            socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to fetch DM list' });
        }
    });

    // ─── Mark DM messages as read ─────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.DM_MARK_READ, async ({ dmId }: { dmId: number }) => {
        try {
            await markDmMessagesRead(dmId, userId);
            const totalUnread = await getTotalDmUnreadCount(userId);
            socket.emit(SOCKET_EVENTS.DM_UNREAD_COUNT, { totalUnread });
        } catch (err: any) {
            console.error('[Socket] DM_MARK_READ error:', err.message);
            socket.emit(SOCKET_EVENTS.ERROR, { message: 'Failed to mark DM as read' });
        }
    });

    // ─── Typing indicator ─────────────────────────────────────────────────────
    socket.on(
        SOCKET_EVENTS.DM_TYPING,
        ({ toUserId, isTyping }: { toUserId: number; isTyping: boolean }) => {
            io.to(`user:${toUserId}`).emit(SOCKET_EVENTS.DM_TYPING_BROADCAST, {
                fromUserId: userId,
                isTyping,
            });
        }
    );
};
