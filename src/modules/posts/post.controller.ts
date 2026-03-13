import { Request, Response, NextFunction } from 'express';
import { Post } from './post.model';
import { ApiResponse } from '../../utils/response';
import { User } from '../users/user.model';
import { Profile } from '../profiles/profile.model';
import { uploadToS3 } from '../../utils/s3';
import { parseInputArray } from '../../utils/parser';
import { PostLike } from './postLike.model';
import { PostSave } from './postSave.model';
import { PostComment } from './postComment.model';

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
        const userId = (req as any).user?.id;
        const posts = await Post.findAll({
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email'],
                    include: [{
                        model: Profile,
                        as: 'profile',
                        attributes: ['fullName', 'avatar']
                    }]
                },
                { model: PostLike, as: 'likes', attributes: ['userId'] },
                { model: PostSave, as: 'saves', attributes: ['userId'] },
                { model: PostComment, as: 'comments', attributes: ['id'] }
            ],
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

            postJson.likeCount = postJson.likes?.length || 0;
            postJson.saveCount = postJson.saves?.length || 0;
            postJson.commentCount = postJson.comments?.length || 0;
            postJson.isLiked = userId ? postJson.likes?.some((like: any) => like.userId === userId) : false;
            postJson.isSaved = userId ? postJson.saves?.some((save: any) => save.userId === userId) : false;

            delete postJson.likes;
            delete postJson.saves;
            delete postJson.comments;

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
        const userId = (req as any).user?.id;
        const { id } = req.params;
        const post = await Post.findByPk(Number(id), {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'email'],
                    include: [{ model: Profile, as: 'profile', attributes: ['fullName', 'avatar'] }]
                },
                { model: PostLike, as: 'likes', attributes: ['userId'] },
                { model: PostSave, as: 'saves', attributes: ['userId'] },
                { model: PostComment, as: 'comments', attributes: ['id'] }
            ]
        });
        if (!post) {
            return res.status(404).json(ApiResponse.error('Post not found'));
        }

        const postJson = post.toJSON() as any;
        const profile = postJson.user?.profile;
        if (profile) {
            postJson.user.fullName = profile.fullName ?? null;
            postJson.user.avatar = profile.avatar ?? null;
            delete postJson.user.profile;
        }

        postJson.likeCount = postJson.likes?.length || 0;
        postJson.saveCount = postJson.saves?.length || 0;
        postJson.commentCount = postJson.comments?.length || 0;
        postJson.isLiked = userId ? postJson.likes?.some((like: any) => like.userId === userId) : false;
        postJson.isSaved = userId ? postJson.saves?.some((save: any) => save.userId === userId) : false;

        delete postJson.likes;
        delete postJson.saves;
        delete postJson.comments;

        return res.status(200).json(ApiResponse.success('Post fetched successfully', postJson));
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

/**
 * Toggle like for a post
 */
export const toggleLikePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const post = await Post.findByPk(Number(id));
        if (!post) {
            return res.status(404).json(ApiResponse.error('Post not found'));
        }

        const existingLike = await PostLike.findOne({ where: { postId: Number(id), userId } });
        if (existingLike) {
            await existingLike.destroy();
            return res.status(200).json(ApiResponse.success('Post unliked successfully', { isLiked: false }));
        } else {
            await PostLike.create({ postId: Number(id), userId });
            return res.status(200).json(ApiResponse.success('Post liked successfully', { isLiked: true }));
        }
    } catch (error: any) {
        next(error);
    }
};

/**
 * Toggle save for a post
 */
export const toggleSavePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const post = await Post.findByPk(Number(id));
        if (!post) {
            return res.status(404).json(ApiResponse.error('Post not found'));
        }

        const existingSave = await PostSave.findOne({ where: { postId: Number(id), userId } });
        if (existingSave) {
            await existingSave.destroy();
            return res.status(200).json(ApiResponse.success('Post unsaved successfully', { isSaved: false }));
        } else {
            await PostSave.create({ postId: Number(id), userId });
            return res.status(200).json(ApiResponse.success('Post saved successfully', { isSaved: true }));
        }
    } catch (error: any) {
        next(error);
    }
};

/**
 * Add a comment to a post
 */
export const addComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;
        const { text } = req.body;

        if (!text) {
            return res.status(400).json(ApiResponse.error('Comment text is required'));
        }

        const post = await Post.findByPk(Number(id));
        if (!post) {
            return res.status(404).json(ApiResponse.error('Post not found'));
        }

        const comment = await PostComment.create({ text, postId: Number(id), userId });

        // Fetch to embed user profile data
        const completeComment = await PostComment.findByPk(comment.id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'email'],
                include: [{
                    model: Profile,
                    as: 'profile',
                    attributes: ['fullName', 'avatar']
                }]
            }]
        });

        let commentJson = completeComment?.toJSON() as any;
        const profile = commentJson.user?.profile;
        if (profile) {
            commentJson.user.fullName = profile.fullName ?? null;
            commentJson.user.avatar = profile.avatar ?? null;
            delete commentJson.user.profile;
        } else if (commentJson.user) {
            commentJson.user.fullName = null;
            commentJson.user.avatar = null;
        }

        return res.status(201).json(ApiResponse.success('Comment added successfully', commentJson));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Get comments for a post
 */
export const getPostComments = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const comments = await PostComment.findAll({
            where: { postId: Number(id) },
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

        const formattedComments = comments.map(comment => {
            const commentJson = comment.toJSON() as any;
            const profile = commentJson.user?.profile;
            if (profile) {
                commentJson.user.fullName = profile.fullName ?? null;
                commentJson.user.avatar = profile.avatar ?? null;
                delete commentJson.user.profile;
            } else if (commentJson.user) {
                commentJson.user.fullName = null;
                commentJson.user.avatar = null;
            }
            return commentJson;
        });

        return res.status(200).json(ApiResponse.success('Comments fetched successfully', formattedComments));
    } catch (error: any) {
        next(error);
    }
};

/**
 * get my saved posts
 */
export const getMySavedPosts = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const savedPosts = await PostSave.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            include: [{
                model: Post,
                as: 'post', 
            }]
        });

        return res.status(200).json(ApiResponse.success('Saved posts fetched successfully', savedPosts));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Delete a comment
 */
export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { commentId } = req.params;
        const userId = (req as any).user.id;

        const comment = await PostComment.findByPk(Number(commentId));
        if (!comment) {
            return res.status(404).json(ApiResponse.error('Comment not found'));
        }

        if (comment.userId !== userId) {
            return res.status(403).json(ApiResponse.error('Not authorized to delete this comment'));
        }

        await comment.destroy();
        return res.status(200).json(ApiResponse.success('Comment deleted successfully', {}));
    } catch (error: any) {
        next(error);
    }
};

