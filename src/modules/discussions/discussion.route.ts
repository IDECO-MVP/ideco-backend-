import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { upload } from '../../middleware/upload';
import {
    createDiscussion,
    getDiscussionsByProject,
    updateDiscussion,
    deleteDiscussion,
    getAllFilesByProject
} from './discussion.controller';

const router = Router();

// Protected routes
router.post('/', authMiddleware, upload.single('file'), createDiscussion);
router.get('/project/:projectId', authMiddleware, getDiscussionsByProject);
router.get('/files/:projectId', authMiddleware, getAllFilesByProject);
router.put('/:id', authMiddleware, upload.single('file'), updateDiscussion);
router.delete('/:id', authMiddleware, deleteDiscussion);

export default router;
