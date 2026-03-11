import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import {
    applyToProject,
    getCollaborationRequests,
    updateCollaborationStatus,
    getProjectCollaborators,
    getMyCollaborations
} from './collaboration.controller';

const router = Router();

// Protected routes
router.post('/apply', authMiddleware, applyToProject);
router.get('/requests/:projectId', authMiddleware, getCollaborationRequests);
router.patch('/status/:collaborationId', authMiddleware, updateCollaborationStatus);
router.get('/me', authMiddleware, getMyCollaborations);

// Public or semi-public route
router.get('/project/:projectId', getProjectCollaborators);

export default router;
