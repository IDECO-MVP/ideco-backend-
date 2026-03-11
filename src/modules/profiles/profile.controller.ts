import { Request, Response, NextFunction } from 'express';
import { Profile } from './profile.model';
import { ApiResponse } from '../../utils/response';
import { uploadToCloudinary } from '../../utils/cloudinary';
import { parseInputArray } from '../../utils/parser';

/**
 * Get logged-in user's profile
 */
export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;
        const profile = await Profile.findOne({ where: { userId } });

        if (!profile) {
            return res.status(404).json(ApiResponse.error('Profile not found'));
        }

        return res.status(200).json(ApiResponse.success('Profile fetched successfully', profile));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Helper to handle file uploads to Cloudinary
 */
const handleFileUploads = async (req: Request) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const uploadData: any = {};

    if (files?.avatar?.[0]) {
        uploadData.avatar = await uploadToCloudinary(files.avatar[0].buffer, 'avatars');
    }

    if (files?.coverImage?.[0]) {
        uploadData.coverImage = await uploadToCloudinary(files.coverImage[0].buffer, 'covers');
    }

    return uploadData;
};

/**
 * Create profile for logged-in user
 */
export const createProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.id;

        const existingProfile = await Profile.findOne({ where: { userId } });
        if (existingProfile) {
            return res.status(400).json(ApiResponse.error('Profile already exists for this user'));
        }

        // Handle Image Uploads
        const uploadData = await handleFileUploads(req);

        const profileData = {
            ...req.body,
            ...uploadData,
            userId,
            languages: parseInputArray(req.body.languages),
            skills: parseInputArray(req.body.skills),
            interests: parseInputArray(req.body.interests)
        };

        const profile = await Profile.create(profileData);
        return res.status(201).json(ApiResponse.success('Profile created successfully', profile));
    } catch (error: any) {
        next(error);
    }
};

/**
 * Update profile
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const loggedInUserId = (req as any).user.id;

        // Handle Image Uploads
        const uploadData = await handleFileUploads(req);

        const updateData = {
            ...req.body,
            ...uploadData
        };

        // Remove userId from update body to prevent identity theft
        delete updateData.userId;

        if (updateData.languages) {
            updateData.languages = parseInputArray(updateData.languages);
        }

        if (updateData.skills) {
            updateData.skills = parseInputArray(updateData.skills);
        }

        if (updateData.interests) {
            updateData.interests = parseInputArray(updateData.interests);
        }

        const [updatedCount] = await Profile.update(updateData, {
            where: { userId: loggedInUserId }
        });

        if (updatedCount === 0 && Object.keys(uploadData).length === 0) {
            return res.status(404).json(ApiResponse.error('Profile not found or no changes made'));
        }

        const updatedProfile = await Profile.findOne({ where: { userId: loggedInUserId } });
        return res.status(200).json(ApiResponse.success('Profile updated successfully', updatedProfile));
    } catch (error: any) {
        next(error);
    }
};
