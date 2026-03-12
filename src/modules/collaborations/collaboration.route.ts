import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import {
    applyToProject,
    getCollaborationRequests,
    getAllMyProjectRequests,
    updateCollaborationStatus,
    getProjectCollaborators,
    getMyCollaborations,
    markAsRead
} from './collaboration.controller';

const router = Router();

// Protected routes
router.post('/apply', authMiddleware, applyToProject);
router.get('/requests/:projectId', authMiddleware, getCollaborationRequests);
router.get('/all-project-requests', authMiddleware, getAllMyProjectRequests);
router.patch('/status/:collaborationId', authMiddleware, updateCollaborationStatus);
router.patch('/mark-as-read/:collaborationId', authMiddleware, markAsRead);
router.get('/me', authMiddleware, getMyCollaborations);

// Public or semi-public route
router.get('/project/:projectId', getProjectCollaborators);

export default router;
