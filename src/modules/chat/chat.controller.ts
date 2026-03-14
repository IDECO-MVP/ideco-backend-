import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../../utils/response';
import {
    getPodByProjectId,
    getPodMessages,
    markPodMessagesRead,
    getUserPods,
    getUserDmList,
    getOrCreateDmConversation,
    getDmMessages,
    markDmMessagesRead,
    getPodUnreadCount,
    getTotalDmUnreadCount,
    isPodMember,
} from './chat.service';
import { WorkspacePod } from './workspacePod.model';

// ══════════════════════════════════════════════════════════════════════════════
// WORKSPACE POD CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/chat/pods
 * Get all workspace pods the logged-in user belongs to (with unread counts).
 */
export const getMyPods = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const pods = await getUserPods(userId);
        return res.status(200).json(ApiResponse.success('Workspace pods fetched successfully', pods));
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/chat/pods/project/:projectId
 * Get a specific workspace pod by project ID.
 */
export const getPodByProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { projectId } = req.params;

        const pod = await getPodByProjectId(Number(projectId));
        if (!pod) {
            return res.status(404).json(ApiResponse.error('Workspace pod not found for this project'));
        }

        // Access control – must be a member
        const memberAccess = await isPodMember(pod.id, userId);
        if (!memberAccess) {
            return res.status(403).json(ApiResponse.error('You are not a member of this workspace pod'));
        }

        return res.status(200).json(ApiResponse.success('Workspace pod fetched successfully', pod));
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/chat/pods/:podId/messages?page=1&limit=50
 * Get paginated message history for a workspace pod.
 */
export const getPodMessageHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const podId = Number(req.params.podId);
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 50;

        // Access control
        const memberAccess = await isPodMember(podId, userId);
        if (!memberAccess) {
            return res.status(403).json(ApiResponse.error('You are not a member of this workspace pod'));
        }

        const data = await getPodMessages(podId, page, limit);
        return res.status(200).json(ApiResponse.success('Pod messages fetched successfully', data));
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/chat/pods/:podId/read
 * Mark all messages in a pod as read for the logged-in user.
 */
export const markPodRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const podId = Number(req.params.podId);

        await markPodMessagesRead(podId, userId);

        const unread = await getPodUnreadCount(podId, userId);

        return res.status(200).json(ApiResponse.success('Pod messages marked as read', { unreadCount: unread }));
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/chat/pods/:podId/unread
 * Get unread message count for the logged-in user in a pod.
 */
export const getPodUnread = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const podId = Number(req.params.podId);

        const count = await getPodUnreadCount(podId, userId);
        return res.status(200).json(ApiResponse.success('Unread count fetched', { unreadCount: count }));
    } catch (error) {
        next(error);
    }
};

// ══════════════════════════════════════════════════════════════════════════════
// DIRECT MESSAGE CONTROLLERS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/chat/dm
 * Get all DM conversations for the logged-in user.
 */
export const getDmConversations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const list = await getUserDmList(userId);
        return res.status(200).json(ApiResponse.success('DM conversations fetched successfully', list));
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/chat/dm/open
 * Get or create a DM conversation with another user and return the full thread.
 * Body: { otherUserId: number }
 */
export const openDmConversation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { otherUserId } = req.body;

        if (!otherUserId) {
            return res.status(400).json(ApiResponse.error('otherUserId is required'));
        }

        if (Number(otherUserId) === userId) {
            return res.status(400).json(ApiResponse.error('You cannot message yourself'));
        }

        const dm = await getOrCreateDmConversation(userId, Number(otherUserId));
        return res.status(200).json(ApiResponse.success('DM conversation opened', dm));
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/chat/dm/:dmId/messages?page=1&limit=50
 * Get paginated message history for a DM conversation.
 */
export const getDmMessageHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const dmId = Number(req.params.dmId);
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 50;

        const data = await getDmMessages(dmId, page, limit);
        return res.status(200).json(ApiResponse.success('DM messages fetched successfully', data));
    } catch (error) {
        next(error);
    }
};

/**
 * PATCH /api/chat/dm/:dmId/read
 * Mark all DM messages in a conversation as read.
 */
export const markDmRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const dmId = Number(req.params.dmId);

        await markDmMessagesRead(dmId, userId);

        return res.status(200).json(ApiResponse.success('DM messages marked as read', {}));
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/chat/dm/unread-total
 * Get total unread DM count across all conversations.
 */
export const getDmUnreadTotal = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const count = await getTotalDmUnreadCount(userId);
        return res.status(200).json(ApiResponse.success('Total unread DM count fetched', { unreadCount: count }));
    } catch (error) {
        next(error);
    }
};
