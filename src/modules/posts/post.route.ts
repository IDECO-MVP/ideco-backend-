import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { optionalAuthMiddleware } from '../../middleware/optionalAuth';
import { upload } from '../../middleware/upload';
import {
    createPost,
    getAllPosts,
    getPostById,
    getPostsByUserId,
    updatePost,
    deletePost,
    getMyPosts,
    toggleLikePost,
    toggleSavePost,
    addComment,
    getPostComments,
    deleteComment,
    getMySavedPosts,
    getPostCategories
} from './post.controller';

const router = Router();

// Public/Optional auth routes
router.get('/', optionalAuthMiddleware, getAllPosts);
router.get('/get/:id', optionalAuthMiddleware, getPostById);
router.get('/user/:userId', optionalAuthMiddleware, getPostsByUserId);
router.get('/comments/:id', getPostComments);
router.get('/saved/my', authMiddleware, getMySavedPosts);
router.get('/categories', getPostCategories);

// Protected routes
router.get('/me', authMiddleware, getMyPosts); // Get posts of the authenticated user
router.post('/', authMiddleware, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), createPost);
router.put('/:id', authMiddleware, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), updatePost);
router.delete('/:id', authMiddleware, deletePost);

// Post Interactions (Protected)
router.post('/like/:id', authMiddleware, toggleLikePost);
router.post('/save/:id', authMiddleware, toggleSavePost);
router.post('/comments/:id', authMiddleware, addComment);
router.delete('/comments/:commentId', authMiddleware, deleteComment);

export default router;
