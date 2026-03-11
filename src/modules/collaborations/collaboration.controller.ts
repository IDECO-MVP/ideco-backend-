import { Request, Response, NextFunction } from 'express';
import { Collaboration } from './collaboration.model';
import { Project } from '../projects/project.model';
import { User } from '../users/user.model';
import { ApiResponse } from '../../utils/response';

/**
 * Apply to a project
 */
export const applyToProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { projectId } = req.body;

        // Check if project exists
        const project = await Project.findByPk(Number(projectId));
        if (!project) {
            return res.status(404).json(ApiResponse.error('Project not found'));
        }

        // Check if user is the owner
        if (project.userId === userId) {
            return res.status(400).json(ApiResponse.error('You cannot apply to your own project'));
        }

        // Check if already applied
        const existingCollab = await Collaboration.findOne({
            where: { projectId, userId }
        });

        if (existingCollab) {
            return res.status(400).json(ApiResponse.error('You have already applied to this project', existingCollab));
        }

        const collaboration = await Collaboration.create({
            projectId,
            userId,
            status: 'pending'
        });

        return res.status(201).json(ApiResponse.success('Applied to project successfully', collaboration));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Get collaboration requests for a project (Owner only)
 */
export const getCollaborationRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { projectId } = req.params;

        const project = await Project.findByPk(Number(projectId));
        if (!project) {
            return res.status(404).json(ApiResponse.error('Project not found'));
        }

        if (project.userId !== userId) {
            return res.status(403).json(ApiResponse.error('Unauthorized to view requests for this project'));
        }

        const requests = await Collaboration.findAll({
            where: { projectId: Number(projectId) },
            include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json(ApiResponse.success('Collaboration requests fetched successfully', requests));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Update collaboration status (Owner only)
 */
export const updateCollaborationStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { collaborationId } = req.params;
        const { status } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json(ApiResponse.error('Invalid status. Must be approved or rejected'));
        }

        const collaboration = await Collaboration.findByPk(Number(collaborationId), {
            include: [{ model: Project, as: 'project' }]
        });

        if (!collaboration) {
            return res.status(404).json(ApiResponse.error('Collaboration request not found'));
        }

        // Check if current user is the owner of the project
        if (collaboration.project.userId !== userId) {
            return res.status(403).json(ApiResponse.error('Unauthorized to update this request'));
        }

        await collaboration.update({ status });

        return res.status(200).json(ApiResponse.success(`Collaboration request ${status} successfully`, collaboration));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Get approved collaborators for a project
 */
export const getProjectCollaborators = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.params;

        const collaborators = await Collaboration.findAll({
            where: { projectId: Number(projectId), status: 'approved' },
            include: [{ model: User, as: 'user', attributes: ['id', 'email'] }]
        });

        return res.status(200).json(ApiResponse.success('Collaborators fetched successfully', collaborators));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Get my collaboration applications (Projects I applied to)
 */
export const getMyCollaborations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;

        const collaborations = await Collaboration.findAll({
            where: { userId },
            include: [{ model: Project, as: 'project' }],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json(ApiResponse.success('My collaborations fetched successfully', collaborations));
    } catch (error: any) {
        next(error);
    }
};
