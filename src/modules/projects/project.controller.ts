import { Request, Response, NextFunction } from 'express';
import { Project } from './project.model';
import { ApiResponse } from '../../utils/response';
import { User } from '../users/user.model';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { parseInputArray } from '../../utils/parser';
import { getPagination, getPagingData } from '../../utils/pagination';

/**
 * Create a new project
 */
export const createProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { title, status, description, addInFeuturedWork, link, seekings } = req.body;
        let imageUrl = req.body.image;

        if (req.file) {
            imageUrl = await uploadToCloudinary(req.file.buffer, 'projects');
        }

        if (link && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(link)) {
            return res.status(400).json(ApiResponse.error('Invalid URL for link'));
        }

        const project = await Project.create({
            image: imageUrl,
            title,
            status,
            description,
            skills: parseInputArray(req.body.skills),
            userId,
            addInFeuturedWork: addInFeuturedWork === 'true' || addInFeuturedWork === true,
            link,
            seekings: parseInputArray(seekings)
        });

        return res.status(201).json(ApiResponse.success('Project created successfully', project));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Get all projects
 */
export const getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, status } = req.query;
        const { offset, limit: l } = getPagination(page, limit);

        const where: any = {};
        const statusValue = typeof status === 'string' ? status.trim() : undefined;
        if (statusValue) {
            // Direct match against stored status values
            where.status = statusValue;
        }

        const { count, rows: projects } = await Project.findAndCountAll({
            where,
            include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
            order: [['createdAt', 'DESC']],
            limit: l,
            offset: offset
        });

        const metadata = getPagingData(count, page, l);

        return res.status(200).json(ApiResponse.successWithPagination('Projects fetched successfully', projects, metadata));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Get project by ID
 */
export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const project = await Project.findByPk(Number(id), {
            include: [{ model: User, as: 'user', attributes: ['id', 'email'] }]
        });
        if (!project) {
            return res.status(404).json(ApiResponse.error('Project not found'));
        }
        return res.status(200).json(ApiResponse.success('Project fetched successfully', project));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Get projects by User ID
 */
export const getProjectsByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const projects = await Project.findAll({
            where: { userId: Number(userId) },
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json(ApiResponse.success('User projects fetched successfully', projects));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Get featured projects by User ID
 */
export const getFeaturedProjectsByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const projects = await Project.findAll({
            where: {
                userId: Number(userId),
                addInFeuturedWork: true
            },
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json(ApiResponse.success('User featured projects fetched successfully', projects));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Get my projects
 */
export const getMyProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { page, limit, status } = req.query;
        const { offset, limit: l } = getPagination(page, limit);

        const where: any = { userId };
        const statusValue = typeof status === 'string' ? status.trim() : undefined;
        if (statusValue) {
            where.status = statusValue;
        }

        const { count, rows: projects } = await Project.findAndCountAll({
            where,
            include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
            order: [['createdAt', 'DESC']],
            limit: l,
            offset: offset
        });

        const metadata = getPagingData(count, page, l);

        return res.status(200).json(ApiResponse.successWithPagination('My projects fetched successfully', projects, metadata));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Update a project
 */
export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const project = await Project.findOne({ where: { id: Number(id), userId } });
        if (!project) {
            return res.status(404).json(ApiResponse.error('Project not found or unauthorized'));
        }

        let imageUrl = req.body.image || project.image;
        if (req.file) {
            imageUrl = await uploadToCloudinary(req.file.buffer, 'projects');
        }

        if (req.body.link && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(req.body.link)) {
            return res.status(400).json(ApiResponse.error('Invalid URL for link'));
        }

        await project.update({
            image: imageUrl,
            title: req.body.title || project.title,
            status: req.body.status || project.status,
            description: req.body.description || project.description,
            skills: req.body.skills ? parseInputArray(req.body.skills) : project.skills,
            addInFeuturedWork: req.body.addInFeuturedWork !== undefined ? (req.body.addInFeuturedWork === 'true' || req.body.addInFeuturedWork === true) : project.addInFeuturedWork,
            link: req.body.link || project.link,
            seekings: req.body.seekings ? parseInputArray(req.body.seekings) : project.seekings
        });

        return res.status(200).json(ApiResponse.success('Project updated successfully', project));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Delete a project
 */
export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const project = await Project.findOne({ where: { id: Number(id), userId } });
        if (!project) {
            return res.status(404).json(ApiResponse.error('Project not found or unauthorized'));
        }

        await project.destroy();
        return res.status(200).json(ApiResponse.success('Project deleted successfully', {}));
    } catch (error: any) {
        next(error);
    }
};

