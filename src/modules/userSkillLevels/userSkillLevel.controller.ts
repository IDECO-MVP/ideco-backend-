import { Request, Response, NextFunction } from 'express';
import { UserSkillLevel } from './userSkillLevel.model';
import { ApiResponse } from '../../utils/response';

/**
 * Create a new user skill level
 */
export const createUserSkillLevel = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const { name, level } = req.body;

        const skillLevel = await UserSkillLevel.create({
            userId,
            name,
            level
        });

        return res.status(201).json(ApiResponse.success('Skill level created successfully', skillLevel));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Update a user skill level
 */
export const updateUserSkillLevel = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const skillLevel = await UserSkillLevel.findOne({ where: { id: Number(id), userId } });
        if (!skillLevel) {
            return res.status(404).json(ApiResponse.error('Skill level not found or unauthorized'));
        }

        const { name, level } = req.body;
        await skillLevel.update({
            name: name || skillLevel.name,
            level: level || skillLevel.level
        });

        return res.status(200).json(ApiResponse.success('Skill level updated successfully', skillLevel));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Get my skill levels
 */
export const getMySkillLevels = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const skillLevels = await UserSkillLevel.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json(ApiResponse.success('Your skill levels fetched successfully', skillLevels));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Get skill levels by User ID
 */
export const getSkillLevelsByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const skillLevels = await UserSkillLevel.findAll({
            where: { userId: Number(userId) },
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json(ApiResponse.success('User skill levels fetched successfully', skillLevels));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Delete a skill level
 */
export const deleteUserSkillLevel = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user.id;

        const skillLevel = await UserSkillLevel.findOne({ where: { id: Number(id), userId } });
        if (!skillLevel) {
            return res.status(404).json(ApiResponse.error('Skill level not found or unauthorized'));
        }

        await skillLevel.destroy();
        return res.status(200).json(ApiResponse.success('Skill level deleted successfully', {}));
    } catch (error: any) {
        next(error);
    }
};
