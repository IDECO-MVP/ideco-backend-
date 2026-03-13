import { Request, Response, NextFunction } from 'express';
import { Milestone } from './milestone.model';
import { Project } from './project.model';
import { ApiResponse } from '../../utils/response';

/**
 * Create a new milestone
 */
export const createMilestone = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { projectId, name, target } = req.body;

        if (!projectId || !name || !target) {
            return res.status(400).json(ApiResponse.error('projectId, name, and target are required'));
        }

        // Verify project exists
        const project = await Project.findByPk(Number(projectId));
        if (!project) {
            return res.status(404).json(ApiResponse.error('Project not found'));
        }

        const milestone = await Milestone.create({
            projectId: Number(projectId),
            name,
            target,
        });

        return res.status(201).json(ApiResponse.success('Milestone created successfully', milestone));
    } catch (error) {
        next(error);
    }
};

/**
 * Get all milestones by projectId
 */
export const getMilestonesByProjectId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.params;

        // Verify project exists
        const project = await Project.findByPk(Number(projectId));
        if (!project) {
            return res.status(404).json(ApiResponse.error('Project not found'));
        }

        const milestones = await Milestone.findAll({
            where: { projectId: Number(projectId) },
            order: [['target', 'ASC']],
        });

        return res.status(200).json(ApiResponse.success('Milestones fetched successfully', milestones));
    } catch (error) {
        next(error);
    }
};

/**
 * Update a milestone
 */
export const updateMilestone = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { name, target } = req.body;

        const milestone = await Milestone.findByPk(Number(id));
        if (!milestone) {
            return res.status(404).json(ApiResponse.error('Milestone not found'));
        }

        await milestone.update({
            name: name ?? milestone.name,
            target: target ?? milestone.target,
        });

        return res.status(200).json(ApiResponse.success('Milestone updated successfully', milestone));
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a milestone
 */
export const deleteMilestone = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const milestone = await Milestone.findByPk(Number(id));
        if (!milestone) {
            return res.status(404).json(ApiResponse.error('Milestone not found'));
        }

        await milestone.destroy();
        return res.status(200).json(ApiResponse.success('Milestone deleted successfully', {}));
    } catch (error) {
        next(error);
    }
};
