import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import {
    createTask,
    getTasksByProject,
    updateTaskStatus,
    updateTask,
    deleteTask
} from './task.controller';

const router = Router();

// Routes
router.post('/', authMiddleware, createTask);
router.get('/project/:projectId', authMiddleware, getTasksByProject);
router.patch('/:id/status', authMiddleware, updateTaskStatus);
router.put('/:id', authMiddleware, updateTask);
router.delete('/:id', authMiddleware, deleteTask);

export default router;
