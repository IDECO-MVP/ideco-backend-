import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import {
    createMilestone,
    getMilestonesByProjectId,
    updateMilestone,
    deleteMilestone,
} from './milestone.controller';

const router = Router();

// Get milestones by project ID (public/authenticated)
router.get('/project/:projectId', authMiddleware, getMilestonesByProjectId);

// Protected routes
router.post('/', authMiddleware, createMilestone);
router.put('/:id', authMiddleware, updateMilestone);
router.delete('/:id', authMiddleware, deleteMilestone);

export default router;
