import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import {
    getMyPods,
    getPodByProject,
    getPodMessageHistory,
    markPodRead,
    getPodUnread,
    getDmConversations,
    openDmConversation,
    getDmMessageHistory,
    markDmRead,
    getDmUnreadTotal,
} from './chat.controller';

const router = Router();

// ─── Workspace Pod Routes ─────────────────────────────────────────────────────
/** GET  /api/chat/pods  – all pods the user belongs to */
router.get('/pods', authMiddleware, getMyPods);

/** GET  /api/chat/pods/project/:projectId  – pod for a specific project */
router.get('/pods/project/:projectId', authMiddleware, getPodByProject);

/** GET  /api/chat/pods/:podId/messages  – message history */
router.get('/pods/:podId/messages', authMiddleware, getPodMessageHistory);

/** PATCH /api/chat/pods/:podId/read  – mark messages read */
router.patch('/pods/:podId/read', authMiddleware, markPodRead);

/** GET  /api/chat/pods/:podId/unread  – unread count */
router.get('/pods/:podId/unread', authMiddleware, getPodUnread);

// ─── Direct Message Routes ────────────────────────────────────────────────────
/** GET  /api/chat/dm  – all DM conversations */
router.get('/dm', authMiddleware, getDmConversations);

/** GET  /api/chat/dm/unread-total  – total unread DMs */
router.get('/dm/unread-total', authMiddleware, getDmUnreadTotal);

/** POST /api/chat/dm/open  – open or create DM conversation */
router.post('/dm/open', authMiddleware, openDmConversation);

/** GET  /api/chat/dm/:dmId/messages  – DM message history */
router.get('/dm/:dmId/messages', authMiddleware, getDmMessageHistory);

/** PATCH /api/chat/dm/:dmId/read  – mark DM read */
router.patch('/dm/:dmId/read', authMiddleware, markDmRead);

export default router;
