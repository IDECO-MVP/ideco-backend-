import { Request, Response, NextFunction } from 'express';
import { FeaturedWork } from './featuredWork.model';
import { ApiResponse } from '../../utils/response';
import { User } from '../users/user.model';
import { Project } from '../projects/project.model';
import { uploadToS3 } from '../../utils/s3';
import { parseInputArray } from '../../utils/parser';
import { getPagination, getPagingData } from '../../utils/pagination';

/**
 * Sync FeaturedWork to Project
 */
const syncToProject = async (featuredWork: FeaturedWork) => {
    if (featuredWork.projectId) {
        const project = await Project.findByPk(featuredWork.projectId);
        if (project) {
            await project.update({
                image: featuredWork.image,
                title: featuredWork.title,
                status: featuredWork.status,
                description: featuredWork.description,
                skills: featuredWork.skills,
                link: featuredWork.link,
                seekings: featuredWork.seekings,
                opened: featuredWork.opened,
                addInFeuturedWork: true
            });
        }
    }
};

/**
 * Create a new featured work
 */
export const createFeaturedWork = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { title, status, description, projectId, link, seekings, opened } = req.body;
        let imageUrl = req.body.image;

        if (req.file) {
            imageUrl = await uploadToS3(req.file.buffer, 'featured-works', req.file.originalname, req.file.mimetype);
        }

        if (link && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(link)) {
            return res.status(400).json(ApiResponse.error('Invalid URL for link'));
        }

        const featuredWork = await FeaturedWork.create({
            image: imageUrl,
            title,
            status,
            description,
            skills: parseInputArray(req.body.skills),
            userId,
            projectId: projectId ? Number(projectId) : null,
            link,
            seekings: parseInputArray(seekings),
            opened: opened !== undefined ? (opened === 'true' || opened === true) : true
        });

        // Sync to project if projectId exists
        if (featuredWork.projectId) {
            const project = await Project.findByPk(featuredWork.projectId);
            if (project) {
                await project.update({ addInFeuturedWork: true });
                // We could also sync other fields if needed, but for now we just mark it as featured
            }
        }

        return res.status(201).json(ApiResponse.success('Featured work created successfully', featuredWork));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Get featured works by User ID
 */
export const getFeaturedWorksByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const featuredWorks = await FeaturedWork.findAll({
            where: { userId: Number(userId) },
            order: [['createdAt', 'DESC']],
            include: [{ model: User, as: 'user', attributes: ['id', 'email'] }]
        });
        return res.status(200).json(ApiResponse.success('User featured works fetched successfully', featuredWorks));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Get my featured works
 */
export const getMyFeaturedWorks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { page, limit } = req.query;
        const { offset, limit: l } = getPagination(page, limit);

        const { count, rows: featuredWorks } = await FeaturedWork.findAndCountAll({
            where: { userId },
            include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
            order: [['createdAt', 'DESC']],
            limit: l,
            offset: offset
        });

        const metadata = getPagingData(count, page, l);

        return res.status(200).json(ApiResponse.successWithPagination('My featured works fetched successfully', featuredWorks, metadata));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Update a featured work
 */
export const updateFeaturedWork = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const featuredWork = await FeaturedWork.findOne({ where: { id: Number(id), userId } });

        if (!featuredWork) {
            return res.status(404).json(ApiResponse.error('Featured work not found or unauthorized'));
        }

        let imageUrl = req.body.image || featuredWork.image;
        if (req.file) {
            imageUrl = await uploadToS3(req.file.buffer, 'featured-works', req.file.originalname, req.file.mimetype);
        }

        if (req.body.link && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(req.body.link)) {
            return res.status(400).json(ApiResponse.error('Invalid URL for link'));
        }

        await featuredWork.update({
            image: imageUrl,
            title: req.body.title || featuredWork.title,
            status: req.body.status || featuredWork.status,
            description: req.body.description || featuredWork.description,
            skills: req.body.skills ? parseInputArray(req.body.skills) : featuredWork.skills,
            link: req.body.link || featuredWork.link,
            seekings: req.body.seekings ? parseInputArray(req.body.seekings) : featuredWork.seekings,
            opened: req.body.opened !== undefined ? (req.body.opened === 'true' || req.body.opened === true) : featuredWork.opened
        });

        // Sync to project if projectId exists
        if (featuredWork.projectId) {
            await syncToProject(featuredWork);
        }

        return res.status(200).json(ApiResponse.success('Featured work updated successfully', featuredWork));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Delete a featured work
 */
export const deleteFeaturedWork = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const featuredWork = await FeaturedWork.findOne({ where: { id: Number(id), userId } });
        if (!featuredWork) {
            return res.status(404).json(ApiResponse.error('Featured work not found or unauthorized'));
        }

        const projectId = featuredWork.projectId;
        await featuredWork.destroy();

        // If it was linked to a project, optionally unmark the project as featured
        if (projectId) {
            const project = await Project.findByPk(projectId);
            if (project) {
                await project.update({ addInFeuturedWork: false });
            }
        }

        return res.status(200).json(ApiResponse.success('Featured work deleted successfully', {}));
    } catch (error: any) {
        next(error);
    }
};
