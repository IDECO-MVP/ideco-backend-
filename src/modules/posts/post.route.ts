import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { upload } from '../../middleware/upload';
import {
    createPost,
    getAllPosts,
    getPostById,
    getPostsByUserId,
    updatePost,
    deletePost,
    getMyPosts
} from './post.controller';

const router = Router();

// Public routes
router.get('/', getAllPosts);
router.get('/get/:id', getPostById);
router.get('/user/:userId', getPostsByUserId);
router.get('/me', authMiddleware, getMyPosts); // Get posts of the authenticated user

// Protected routes
router.post('/', authMiddleware, upload.single('image'), createPost);
router.put('/:id', authMiddleware, upload.single('image'), updatePost);
router.delete('/:id', authMiddleware, deletePost);

export default router;
