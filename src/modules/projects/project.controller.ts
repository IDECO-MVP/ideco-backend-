import { Request, Response, NextFunction } from 'express';
import { Project } from './project.model';
import { ApiResponse } from '../../utils/response';
import { User } from '../users/user.model';
import { uploadToS3 } from '../../utils/s3';
import { parseInputArray } from '../../utils/parser';
import { getPagination, getPagingData } from '../../utils/pagination';
import { Op } from 'sequelize';
import { FeaturedWork } from '../featuredWorks/featuredWork.model';
import { Collaboration } from '../collaborations/collaboration.model';
import { Profile } from "../profiles/profile.model";
import { Task } from '../tasks/task.model';

/**
 * Common helper to check if a user has applied to projects
 */
const checkAppliedStatus = async (userId: number | undefined, projects: Project[]) => {
    if (!userId || projects.length === 0) {
        return projects.map(p => ({
            ...p.toJSON(),
            applied: false
        }));
    }

    const projectIds = projects.map(p => p.id);
    const collaborations = await Collaboration.findAll({
        where: {
            userId: userId,
            projectId: projectIds
        },
        attributes: ['projectId']
    });

    const appliedProjectIds = new Set(collaborations.map(c => c.projectId));

    return projects.map(p => ({
        ...p.toJSON(),
        applied: appliedProjectIds.has(p.id)
    }));
};

/**
 * Create a new project
 */
export const createProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { title, status, description, addInFeuturedWork, link, seekings, opened, communityId, category } = req.body;
        let imageUrl = req.body.image;

        if (req.file) {
            imageUrl = await uploadToS3(req.file.buffer, 'projects', req.file.originalname, req.file.mimetype);
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
            seekings: parseInputArray(seekings),
            opened: opened !== undefined ? (opened === 'true' || opened === true) : true,
            communityId: communityId ? Number(communityId) : undefined,
            category
        });

        // Sync with FeaturedWork if addInFeuturedWork is true
        if (project.addInFeuturedWork) {
            await FeaturedWork.create({
                image: project.image,
                title: project.title,
                status: project.status,
                description: project.description,
                skills: project.skills,
                userId: project.userId,
                projectId: project.id,
                link: project.link,
                seekings: project.seekings,
                opened: project.opened
            });
        }

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
        const { page, limit, status, skills } = req.query;

        const { offset, limit: l } = getPagination(page, limit);

        const where: any = {};

        // status filter
        const statusValue = typeof status === "string" ? status.trim() : undefined;
        if (statusValue) {
            where.status = statusValue;
        }

        // skills filter
        if (skills && typeof skills === "string") {
            const skillsArray = skills.split(",").map((s) => s.trim());

            where.skills = {
                [Op.overlap]: skillsArray
            };
        }

        const { count, rows: projects } = await Project.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "email"],
                },
            ],
            order: [["createdAt", "DESC"]],
            limit: l,
            offset: offset,
        });

        const metadata = getPagingData(count, page, l);

        const projectsWithApplied = await checkAppliedStatus((req as any).user?.id, projects);

        return res
            .status(200)
            .json(ApiResponse.successWithPagination("Projects fetched successfully", projectsWithApplied, metadata));
    } catch (error: any) {
        next(error);
    }
};

export const getAllOpenProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit } = req.query;

        const { offset, limit: l } = getPagination(page, limit);

        const { count, rows: projects } = await Project.findAndCountAll({
            where: { opened: true },
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "email"],
                },
                {
                    model: Collaboration,
                    as: "collaborations",
                    attributes: ["id", "status"],
                    where: {
                        status: "pending",
                    },
                    required: false
                }
            ],
            order: [["createdAt", "DESC"]],
            limit: l,
            offset: offset,
        });

        const metadata = getPagingData(count, page, l);

        const projectsWithApplied = await checkAppliedStatus((req as any).user?.id, projects);

        const finalProjects = projectsWithApplied.map((project: any) => ({
            ...project,
            applicantsCount: project.collaborations?.length || 0
        }));

        return res.status(200).json(
            ApiResponse.successWithPagination(
                "Open projects fetched successfully",
                finalProjects,
                metadata
            )
        );

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

        const projectData = project.toJSON();
        const userId = (req as any).user?.id;
        let applied = false;

        if (userId) {
            const collaboration = await Collaboration.findOne({
                where: { userId, projectId: project.id }
            });
            applied = !!collaboration;
        }

        return res.status(200).json(ApiResponse.success('Project fetched successfully', { ...projectData, applied }));
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

        const projectsWithApplied = await checkAppliedStatus((req as any).user?.id, projects);

        return res.status(200).json(ApiResponse.success('User projects fetched successfully', projectsWithApplied));
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

        const projectsWithApplied = await checkAppliedStatus((req as any).user?.id, projects);

        return res.status(200).json(ApiResponse.success('User featured projects fetched successfully', projectsWithApplied));
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

        const projectsWithApplied = await checkAppliedStatus(userId, projects);

        return res.status(200).json(ApiResponse.successWithPagination('My projects fetched successfully', projectsWithApplied, metadata));
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
            imageUrl = await uploadToS3(req.file.buffer, 'projects', req.file.originalname, req.file.mimetype);
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
            seekings: req.body.seekings ? parseInputArray(req.body.seekings) : project.seekings,
            opened: req.body.opened !== undefined ? (req.body.opened === 'true' || req.body.opened === true) : project.opened,
            communityId: req.body.communityId ? Number(req.body.communityId) : project.communityId,
            category: req.body.category || project.category
        });

        // Sync with FeaturedWork
        if (project.addInFeuturedWork) {
            const [featuredWork, created] = await FeaturedWork.findOrCreate({
                where: { projectId: project.id },
                defaults: {
                    image: project.image,
                    title: project.title,
                    status: project.status,
                    description: project.description,
                    skills: project.skills,
                    userId: project.userId,
                    projectId: project.id,
                    link: project.link,
                    seekings: project.seekings,
                    opened: project.opened
                }
            });

            if (!created) {
                await featuredWork.update({
                    image: project.image,
                    title: project.title,
                    status: project.status,
                    description: project.description,
                    skills: project.skills,
                    link: project.link,
                    seekings: project.seekings,
                    opened: project.opened
                });
            }
        } else {
            // If addInFeuturedWork is false, remove from FeaturedWork if it was there
            await FeaturedWork.destroy({ where: { projectId: project.id } });
        }

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

        // Delete associated FeaturedWork
        await FeaturedWork.destroy({ where: { projectId: project.id } });

        await project.destroy();
        return res.status(200).json(ApiResponse.success('Project deleted successfully', {}));
    } catch (error: any) {
        next(error);
    }
};

export const getProjectDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { projectId } = req.params;

        const project: any = await Project.findOne({
            where: { id: projectId },
            //   include: [
            //     {
            //       model: User,
            //       as: "user",
            //       attributes: ["id", "email"],
            //     },
            //   ],
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id"],
                    include: [
                        {
                            model: Profile,
                            as: "profile",
                            attributes: ["fullName"]
                        }
                    ]
                },
            ]
        });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: "Project not found",
            });
        }

        // Team members count
        const teamMembers = await Collaboration.count({
            where: {
                projectId,
                status: "approved",
            },
        });

        // Total tasks
        const totalTasks = await Task.count({
            where: { projectId },
        });

        // Completed tasks
        const completedTasks = await Task.count({
            where: {
                projectId,
                status: "completed",
            },
        });

        // Progress %
        const progress =
            totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return res.status(200).json({
            success: true,
            data: {
                id: project.id,
                image: project.image,
                title: project.title,
                description: project.description,
                status: project.status,
                skills: project.skills,
                seekings: project.seekings,
                opened: project.opened,
                leader: project.user,
                teamMembers,

                // NEW FIELDS
                tasksCompleted: `${completedTasks}/${totalTasks}`,
                progressPercent: progress,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getProjectTeam = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { projectId } = req.params;

        const collaborators = await Collaboration.findAll({
            where: {
                projectId,
                status: "approved",
            },
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "email"],
                    include: [
                        {
                            model: Profile,
                            as: "profile",
                        },
                    ],
                },
            ],
        });

        return res.status(200).json({
            success: true,
            data: collaborators,
        });
    } catch (error) {
        next(error);
    }
};