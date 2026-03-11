import { Request, Response, NextFunction } from 'express';
import { Task } from './task.model';
import { Project } from '../projects/project.model';
import { User } from '../users/user.model';
import { ApiResponse } from '../../utils/response';

/**
 * Create a new task
 */
export const createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, description, status, priority, dueDate, projectId, assignedTo } = req.body;

        // Check if project exists
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json(ApiResponse.error('Project not found'));
        }

        // Check if assigned user exists (if provided)
        if (assignedTo) {
            const user = await User.findByPk(assignedTo);
            if (!user) {
                return res.status(404).json(ApiResponse.error('Assigned user not found'));
            }
        }

        const task = await Task.create({
            title,
            description,
            status,
            priority,
            dueDate,
            projectId,
            assignedTo
        });

        return res.status(201).json(ApiResponse.success('Task created successfully', task));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Get tasks by project ID
 */
export const getTasksByProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.params;

        const tasks = await Task.findAll({
            where: { projectId: Number(projectId) },
            include: [
                { model: User, as: 'assignedUser', attributes: ['id', 'email'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json(ApiResponse.success('Tasks fetched successfully', tasks));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Update task status
 */
export const updateTaskStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const task = await Task.findByPk(Number(id));
        if (!task) {
            return res.status(404).json(ApiResponse.error('Task not found'));
        }

        await task.update({ status });

        return res.status(200).json(ApiResponse.success('Task status updated successfully', task));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Update a task
 */
export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { title, description, status, priority, dueDate, assignedTo } = req.body;

        const task = await Task.findByPk(Number(id));
        if (!task) {
            return res.status(404).json(ApiResponse.error('Task not found'));
        }

        // Check if assigned user exists (if provided and changing)
        if (assignedTo && assignedTo !== task.assignedTo) {
            const user = await User.findByPk(assignedTo);
            if (!user) {
                return res.status(404).json(ApiResponse.error('Assigned user not found'));
            }
        }

        await task.update({
            title: title || task.title,
            description: description || task.description,
            status: status || task.status,
            priority: priority || task.priority,
            dueDate: dueDate || task.dueDate,
            assignedTo: assignedTo || task.assignedTo
        });

        return res.status(200).json(ApiResponse.success('Task updated successfully', task));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Delete a task
 */
export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const task = await Task.findByPk(Number(id));
        if (!task) {
            return res.status(404).json(ApiResponse.error('Task not found'));
        }

        await task.destroy();
        return res.status(200).json(ApiResponse.success('Task deleted successfully', {}));
    } catch (error: any) {
        next(error);
    }
};
