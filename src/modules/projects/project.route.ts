import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { upload } from '../../middleware/upload';
import {
    createProject,
    getAllProjects,
    getAllOpenProjects,
    getProjectById,
    getProjectsByUserId,
    updateProject,
    deleteProject,
    getMyProjects,
    getFeaturedProjectsByUserId
} from './project.controller';

const router = Router();

// Public routes
router.get('/', getAllProjects);
router.get('/open', getAllOpenProjects);
router.get('/get/:id', getProjectById);
router.get('/user/:userId', getProjectsByUserId);
router.get('/featured/:userId', getFeaturedProjectsByUserId); // Get featured projects by user ID
router.get('/me', authMiddleware, getMyProjects); // Get projects of the authenticated user

// Protected routes
router.post('/', authMiddleware, upload.single('image'), createProject);
router.put('/:id', authMiddleware, upload.single('image'), updateProject);
router.delete('/:id', authMiddleware, deleteProject);

export default router;
