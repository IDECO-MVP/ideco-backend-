import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import {
    createUserSkillLevel,
    updateUserSkillLevel,
    getMySkillLevels,
    getSkillLevelsByUserId,
    deleteUserSkillLevel
} from './userSkillLevel.controller';

const router = Router();

// Public routes
router.get('/user/:userId', getSkillLevelsByUserId);

// Protected routes
router.get('/me', authMiddleware, getMySkillLevels);
router.post('/', authMiddleware, createUserSkillLevel);
router.put('/:id', authMiddleware, updateUserSkillLevel);
router.delete('/:id', authMiddleware, deleteUserSkillLevel);

export default router;
