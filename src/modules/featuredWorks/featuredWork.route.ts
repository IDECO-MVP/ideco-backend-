import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { upload } from '../../middleware/upload';
import {
    createFeaturedWork,
    getFeaturedWorksByUserId,
    getMyFeaturedWorks,
    updateFeaturedWork,
    deleteFeaturedWork
} from './featuredWork.controller';

const router = Router();

// Public routes
router.get('/user/:userId', getFeaturedWorksByUserId); // Get featured works by user ID

// Protected routes
router.get('/me', authMiddleware, getMyFeaturedWorks); // Get featured works of the authenticated user
router.post('/', authMiddleware, upload.single('image'), createFeaturedWork);
router.put('/:id', authMiddleware, upload.single('image'), updateFeaturedWork);
router.delete('/:id', authMiddleware, deleteFeaturedWork);

export default router;
