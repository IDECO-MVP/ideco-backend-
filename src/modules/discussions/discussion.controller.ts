import e, { Request, Response, NextFunction } from 'express';
import { Discussion } from './discussion.model';
import { Project } from '../projects/project.model';
import { File } from './file.model';
import { User } from '../users/user.model';
import { Profile } from '../profiles/profile.model';
import { ApiResponse } from '../../utils/response';
import { uploadToS3 } from '../../utils/s3';
import { Op } from 'sequelize';

/**
 * Create a new discussion
 */
export const createDiscussion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { message, projectId } = req.body;
        let fileUrl = req.body.file || null;

        // Check if project exists
        const project = await Project.findByPk(projectId);
        if (!project) {
            return res.status(404).json(ApiResponse.error('Project not found'));
        }

        if (req.file) {
            fileUrl = await uploadToS3(req.file.buffer, 'discussions', req.file.originalname, req.file.mimetype);
        }

        const discussion = await Discussion.create({
            message,
            file: fileUrl,
            projectId,
            userId
        });

        await File.create({
            file: fileUrl,
            projectId,
            userId
        });

        return res.status(201).json(ApiResponse.success('Discussion created successfully', discussion));
    } catch (error: any) {
        next(error);
    }
};

/**
 * upload a file
 */

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { projectId } = req.body;
   
        if (!projectId) {  
            return res.status(400).json(ApiResponse.error('Project ID is required'));
        }

        let fileUrl = req.body.file || null;

        if (req.file) {
            fileUrl = await uploadToS3(req.file.buffer, 'discussions', req.file.originalname, req.file.mimetype);
        }

        const file = await File.create({
            file: fileUrl,
            projectId,
            userId
        });

        return res.status(201).json(ApiResponse.success('File uploaded successfully', file));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Get discussions by project ID
 */
export const getDiscussionsByProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.params;

        const discussions = await Discussion.findAll({
            where: { projectId: Number(projectId) },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email'],
                    include: [
                        {
                            model: Profile,
                            as: 'profile',
                            attributes: ['fullName', 'avatar']
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json(ApiResponse.success('Discussions fetched successfully', discussions));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Get Latest 3 discussions by project ID
 */
export const getLatestDiscussionsByProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.params;
        const discussions = await Discussion.findAll({
            where: { projectId: Number(projectId) },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email'],
                    include: [
                        {
                            model: Profile,
                            as: 'profile',
                            attributes: ['fullName', 'avatar']
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: 3
        });

        return res.status(200).json(ApiResponse.success('Latest discussions fetched successfully', discussions));
    } catch (error: any) {
        next(error);
    }
};

export const getAllFilesByProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.params;

        const files = await File.findAll({
            where: {
                projectId: Number(projectId),
                file: { [Op.ne]: null }
            },
            attributes: ['id', 'file', 'createdAt'],
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id'],
                    include: [
                        {
                            model: Profile,
                            as: 'profile',
                            attributes: ['fullName']
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        const filesData = files.map((item: any) => {
            const url = item.file;
            const fileName = url.split('/').pop();
            const extension = fileName.split('.').pop();

            return {
                id: item.id,
                name: fileName,
                type: extension,
                url: url,
                uploadedBy: item.user?.profile?.fullName || null,
                uploadedAt: item.createdAt
            };
        });

        return res.status(200).json(
            ApiResponse.success('Files fetched successfully', filesData)
        );

    } catch (error: any) {
        next(error);
    }
};
/**
 * Update a discussion
 */
export const updateDiscussion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const { message } = req.body;

        const discussion = await Discussion.findOne({ where: { id: Number(id), userId } });
        if (!discussion) {
            return res.status(404).json(ApiResponse.error('Discussion not found or unauthorized'));
        }

        let fileUrl = discussion.file;
        if (req.file) {
            fileUrl = await uploadToS3(req.file.buffer, 'discussions', req.file.originalname, req.file.mimetype);
        }

        await discussion.update({
            message: message || discussion.message,
            file: fileUrl
        });

        return res.status(200).json(ApiResponse.success('Discussion updated successfully', discussion));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Delete a discussion
 */
export const deleteDiscussion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const discussion = await Discussion.findOne({ where: { id: Number(id), userId } });
        if (!discussion) {
            return res.status(404).json(ApiResponse.error('Discussion not found or unauthorized'));
        }

        await discussion.destroy();
        return res.status(200).json(ApiResponse.success('Discussion deleted successfully', {}));
    } catch (error: any) {
        next(error);
    }
};
