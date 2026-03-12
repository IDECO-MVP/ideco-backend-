import { Request, Response, NextFunction } from 'express';
import { Post } from './post.model';
import { ApiResponse } from '../../utils/response';
import { User } from '../users/user.model';
import { Profile } from '../profiles/profile.model';
import { uploadToS3 } from '../../utils/s3';
import { parseInputArray } from '../../utils/parser';

/**
 * Create a new post
 */
export const createPost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { caption, milestoneBadge } = req.body;
        let imageUrl = req.body.image;

        if (req.file) {
            imageUrl = await uploadToS3(req.file.buffer, 'posts', req.file.originalname, req.file.mimetype);
        }

        const post = await Post.create({
            image: imageUrl,
            caption,
            hashtags: parseInputArray(req.body.hashtags),
            milestoneBadge,
            userId
        });

        return res.status(201).json(ApiResponse.success('Post created successfully', post));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Get all posts
 */
export const getAllPosts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const posts = await Post.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'email'],
                include: [{
                    model: Profile,
                    as: 'profile',
                    attributes: ['fullName', 'avatar']
                }]
            }],
            order: [['createdAt', 'DESC']]
        });
        const postsResponse = posts.map((post) => {
            const postJson = post.toJSON() as any;
            const profile = postJson.user?.profile;
            if (profile) {
                postJson.user.fullName = profile.fullName ?? null;
                postJson.user.avatar = profile.avatar ?? null;
                delete postJson.user.profile;
            } else if (postJson.user) {
                postJson.user.fullName = null;
                postJson.user.avatar = null;
            }
            return postJson;
        });
        return res.status(200).json(ApiResponse.success('Posts fetched successfully', postsResponse));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Get post by ID
 */
export const getPostById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const post = await Post.findByPk(Number(id), {
            include: [{ model: User, as: 'user', attributes: ['id', 'email'] }]
        });
        if (!post) {
            return res.status(404).json(ApiResponse.error('Post not found'));
        }
        return res.status(200).json(ApiResponse.success('Post fetched successfully', post));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Get posts by User ID
 */
export const getPostsByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const posts = await Post.findAll({
            where: { userId: Number(userId) },
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json(ApiResponse.success('User posts fetched successfully', posts));
    } catch (error: any) {
        next(error);
    }
};

export const getMyPosts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const posts = await Post.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json(ApiResponse.success('My posts fetched successfully', posts));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Update a post
 */
export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const post = await Post.findOne({ where: { id: Number(id), userId } });
        if (!post) {
            return res.status(404).json(ApiResponse.error('Post not found or unauthorized'));
        }

        let imageUrl = req.body.image || post.image;
        if (req.file) {
            imageUrl = await uploadToS3(req.file.buffer, 'posts', req.file.originalname, req.file.mimetype);
        }

        await post.update({
            image: imageUrl,
            caption: req.body.caption || post.caption,
            hashtags: req.body.hashtags ? parseInputArray(req.body.hashtags) : post.hashtags,
            milestoneBadge: req.body.milestoneBadge || post.milestoneBadge
        });

        return res.status(200).json(ApiResponse.success('Post updated successfully', post));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Delete a post
 */
export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const post = await Post.findOne({ where: { id: Number(id), userId } });
        if (!post) {
            return res.status(404).json(ApiResponse.error('Post not found or unauthorized'));
        }

        await post.destroy();
        return res.status(200).json(ApiResponse.success('Post deleted successfully', {}));
    } catch (error: any) {
        next(error);
    }
};

