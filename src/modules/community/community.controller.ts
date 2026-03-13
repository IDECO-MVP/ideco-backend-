import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/response';
import { Community } from './community.model';
import { CommunityMember } from './communityMember.model';
import { User } from '../users/user.model';
import { Profile } from '../profiles/profile.model';
import { Post } from '../posts/post.model';
import { Project } from '../projects/project.model';
import { Task } from '../tasks/task.model';
import { Collaboration } from '../collaborations/collaboration.model';
import { uploadToS3 } from '../../utils/s3';
import { parseInputArray } from '../../utils/parser';

// Helper to format user output
const includeUser = (as: string = 'user') => ({
    model: User,
    as,
    attributes: ['id'],
    include: [
        {
            model: Profile,
            as: 'profile',
            attributes: ['fullName', 'avatar'],
        },
    ],
});

const formatUserData = (data: any, userKey: string = 'user') => {
    const json = data.toJSON();
    if (json[userKey]) {
        json.user = {
            id: json[userKey].id,
            fullName: json[userKey].profile?.fullName || null,
            avatar: json[userKey].profile?.avatar || null,
        };
        if (userKey !== 'user') {
            delete json[userKey]; // clean up if we used 'creator'
        }
    }
    return json;
};

export const createCommunity = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { name, description, category } = req.body;
        let tags = parseInputArray(req.body.tags);
        let hashtags = parseInputArray(req.body.hashtags);
        let logoImageUrl = req.body.logoImage;
        let coverImageUrl = req.body.coverImage;

        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        if (files) {
            if (files['logoImage'] && files['logoImage'][0]) {
                const file = files['logoImage'][0];
                logoImageUrl = await uploadToS3(file.buffer, 'communities/logos', file.originalname, file.mimetype);
            }
            if (files['coverImage'] && files['coverImage'][0]) {
                const file = files['coverImage'][0];
                coverImageUrl = await uploadToS3(file.buffer, 'communities/covers', file.originalname, file.mimetype);
            }
        }

        const community = await Community.create({
            name,
            description,
            category,
            tags,
            hashtags,
            logoImage: logoImageUrl,
            coverImage: coverImageUrl,
            createdBy: userId,
        });

        // Add creator as admin
        await CommunityMember.create({
            communityId: community.id,
            userId,
            role: 'admin',
        });

        return res.status(201).json(ApiResponse.success('Community created successfully', community));
    } catch (error: any) {
        return res.status(500).json(ApiResponse.error('Error creating community', error.message));
    }
};

export const getCommunities = async (req: Request, res: Response) => {
    try {
        const communities = await Community.findAll();

        // Add memberCount
        const communitiesWithCounts = await Promise.all(
            communities.map(async (comm) => {
                const memberCount = await CommunityMember.count({ where: { communityId: comm.id } });
                return {
                    ...comm.toJSON(),
                    memberCount,
                };
            })
        );

        return res.status(200).json(ApiResponse.success('Communities fetched successfully', communitiesWithCounts));
    } catch (error: any) {
        return res.status(500).json(ApiResponse.error('Error fetching communities', error.message));
    }
};

export const getCommunityById = async (req: Request, res: Response) => {
    try {
        const { communityId } = req.params;

        const community = await Community.findByPk(Number(communityId));
        if (!community) {
            return res.status(404).json(ApiResponse.error('Community not found'));
        }

        const memberCount = await CommunityMember.count({ where: { communityId: Number(communityId) } });

        // recent posts
        const recentPosts = await Post.findAll({
            where: { communityId: Number(communityId) },
            limit: 5,
            order: [['createdAt', 'DESC']],
            include: [includeUser('user')],
        });

        // projects
        const projects = await Project.findAll({
            where: { communityId: Number(communityId) },
            include: [includeUser('user')],
        });

        const formattedPosts = recentPosts.map((p: any) => formatUserData(p, 'user'));
        const formattedProjects = projects.map((p: any) => formatUserData(p, 'user'));

        return res.status(200).json(ApiResponse.success('Community fetched successfully', {
            ...(community.get({ plain: true }) as any),
            memberCount,
            recentPosts: formattedPosts,
            projects: formattedProjects,
        }));
    } catch (error: any) {
        return res.status(500).json(ApiResponse.error('Error fetching community', error.message));
    }
};

export const updateCommunity = async (req: Request, res: Response) => {
    try {
        const { communityId } = req.params;
        const userId = (req as any).user.id;

        const community = await Community.findByPk(Number(communityId));
        if (!community) {
            return res.status(404).json(ApiResponse.error('Community not found'));
        }

        if (community.createdBy !== userId) {
            return res.status(403).json(ApiResponse.error('Forbidden: You can only edit your own communities'));
        }

        const updateData = { ...req.body };
        if (req.body.tags) {
            updateData.tags = parseInputArray(req.body.tags);
        }
        if (req.body.hashtags) {
            updateData.hashtags = parseInputArray(req.body.hashtags);
        }

        let logoImageUrl = req.body.logoImage || community.logoImage;
        let coverImageUrl = req.body.coverImage || community.coverImage;

        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        if (files) {
            if (files['logoImage'] && files['logoImage'][0]) {
                const file = files['logoImage'][0];
                logoImageUrl = await uploadToS3(file.buffer, 'communities/logos', file.originalname, file.mimetype);
            }
            if (files['coverImage'] && files['coverImage'][0]) {
                const file = files['coverImage'][0];
                coverImageUrl = await uploadToS3(file.buffer, 'communities/covers', file.originalname, file.mimetype);
            }
        }

        updateData.logoImage = logoImageUrl;
        updateData.coverImage = coverImageUrl;

        await community.update(updateData);

        return res.status(200).json(ApiResponse.success('Community updated successfully', community));
    } catch (error: any) {
        return res.status(500).json(ApiResponse.error('Error updating community', error.message));
    }
};

export const deleteCommunity = async (req: Request, res: Response) => {
    try {
        const { communityId } = req.params;
        const userId = (req as any).user.id;

        const community = await Community.findByPk(Number(communityId));
        if (!community) {
            return res.status(404).json(ApiResponse.error('Community not found'));
        }

        if (community.createdBy !== userId) {
            return res.status(403).json(ApiResponse.error('Forbidden: You can only delete your own communities'));
        }

        // Delete associated records to satisfy foreign key constraints
        await CommunityMember.destroy({ where: { communityId: Number(communityId) } });
        await Post.destroy({ where: { communityId: Number(communityId) } });
        await Project.destroy({ where: { communityId: Number(communityId) } });

        await community.destroy();

        return res.status(200).json(ApiResponse.success('Community deleted successfully', null));
    } catch (error: any) {
        return res.status(500).json(ApiResponse.error('Error deleting community', error.message));
    }
};

export const joinCommunity = async (req: Request, res: Response) => {
    try {
        const { communityId } = req.params;
        const userId = (req as any).user.id;

        const community = await Community.findByPk(Number(communityId));
        if (!community) return res.status(404).json(ApiResponse.error('Community not found'));

        const existingMember = await CommunityMember.findOne({ where: { communityId: Number(communityId), userId } });
        if (existingMember) {
            return res.status(400).json(ApiResponse.error('Already a member'));
        }

        const member = await CommunityMember.create({
            communityId: Number(communityId),
            userId,
            role: 'member',
        });

        return res.status(200).json(ApiResponse.success('Joined successfully', member));
    } catch (error: any) {
        return res.status(500).json(ApiResponse.error('Error joining community', error.message));
    }
};

export const leaveCommunity = async (req: Request, res: Response) => {
    try {
        const { communityId } = req.params;
        const userId = (req as any).user.id;

        const member = await CommunityMember.findOne({ where: { communityId: Number(communityId), userId } });
        if (!member) {
            return res.status(400).json(ApiResponse.error('Not a member'));
        }

        await member.destroy();

        return res.status(200).json(ApiResponse.success('Left successfully', null));
    } catch (error: any) {
        return res.status(500).json(ApiResponse.error('Error leaving community', error.message));
    }
};

export const getCommunityMembers = async (req: Request, res: Response) => {
    try {
        const { communityId } = req.params;
        const members = await CommunityMember.findAll({
            where: { communityId: Number(communityId) },
            include: [
                {
                    model: User,
                    as: "user",
                    attributes: ["id", "email"],
                    include: [
                        {
                            model: Profile,
                            as: "profile",
                            attributes: ["fullName", "avatar"],
                        },
                    ],
                },
            ],
        });

        const formatted = members.map((m: any) => ({
            id: m.id,
            role: m.role,
            joinedAt: m.joinedAt,
            user: m.user
                ? {
                    id: m.user.id,
                    email: m.user.email,
                    fullName: m.user.profile?.fullName || null,
                    avatar: m.user.profile?.avatar || null,
                }
                : null,
        }));

        return res.status(200).json(ApiResponse.success('Members fetched successfully', formatted));
    } catch (error: any) {
        return res.status(500).json(ApiResponse.error('Error fetching members', error.message));
    }
};

export const getJoinedCommunities = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const joined = await CommunityMember.findAll({
            where: { userId },
            include: [{
                model: Community,
                as: 'community',
                attributes: ['id', 'name']
            }]
        });

        const communities = joined.map((m: any) => m.community);

        return res.status(200).json(ApiResponse.success('Joined communities fetched successfully', communities));
    } catch (error: any) {
        return res.status(500).json(ApiResponse.error('Error fetching joined communities', error.message));
    }
};

export const getPostsByCommunityId = async (req: Request, res: Response) => {
    try {
        const { communityId } = req.params;
        const posts = await Post.findAll({
            where: { communityId: Number(communityId) },
            order: [['createdAt', 'DESC']],
            include: [includeUser('user')],
        });

        const formatted = posts.map((p: any) => formatUserData(p, 'user'));

        return res.status(200).json(ApiResponse.success('Posts fetched successfully', formatted));
    } catch (error: any) {
        return res.status(500).json(ApiResponse.error('Error fetching posts', error.message));
    }
};

export const getProjectsByCommunityId = async (req: Request, res: Response) => {
    try {
        const { communityId } = req.params;
        const projects = await Project.findAll({
            where: { communityId: Number(communityId) },
            order: [['createdAt', 'DESC']],
            include: [includeUser('user')],
        });

        // Attach progress data to each project (same as getProjectDetails)
        const formatted = await Promise.all(
            projects.map(async (project: any) => {
                const base = formatUserData(project, 'user');

                const [totalTasks, completedTasks, teamMembers] = await Promise.all([
                    Task.count({ where: { projectId: project.id } }),
                    Task.count({ where: { projectId: project.id, status: 'completed' } }),
                    Collaboration.count({ where: { projectId: project.id, status: 'approved' } }),
                ]);

                const progressPercent = totalTasks > 0
                    ? Math.round((completedTasks / totalTasks) * 100)
                    : 0;

                return {
                    ...base,
                    teamMembers,
                    tasksCompleted: `${completedTasks}/${totalTasks}`,
                    progressPercent,
                };
            })
        );

        return res.status(200).json(ApiResponse.success('Projects fetched successfully', formatted));
    } catch (error: any) {
        return res.status(500).json(ApiResponse.error('Error fetching projects', error.message));
    }
};
