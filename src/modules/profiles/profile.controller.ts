import { Request, Response, NextFunction } from 'express';
import { Profile } from './profile.model';
import { Collaboration } from '../collaborations/collaboration.model';
import { Project } from '../projects/project.model';
import { ApiResponse } from '../../utils/response';
import { uploadToS3 } from '../../utils/s3';
import { parseInputArray } from '../../utils/parser';
import { getUserFullData } from '../users/user.service';
import { User } from '../users/user.model';
import { Op } from 'sequelize';

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

export const getProfileByUserId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const user = await getUserFullData(Number(userId));

    if (!user) {
      return res.status(404).json(ApiResponse.error('User or profile not found'));
    }
    return res.status(200).json(ApiResponse.success('User and profile fetched successfully', user));
  } catch (error: any) {
    next(error);
  }
};

/**
 * Helper to handle file uploads to AWS S3
 */
const handleFileUploads = async (req: Request) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const uploadData: any = {};

  if (files?.avatar?.[0]) {
    uploadData.avatar = await uploadToS3(files.avatar[0].buffer, 'avatars', files.avatar[0].originalname, files.avatar[0].mimetype);
  }

  if (files?.coverImage?.[0]) {
    uploadData.coverImage = await uploadToS3(files.coverImage[0].buffer, 'covers', files.coverImage[0].originalname, files.coverImage[0].mimetype);
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


/**
 * Calculate match score between two profiles
 */
const calculateMatchScore = (currentProfile: any, targetProfile: any) => {
  let score = 0;

  // Skills match -> weight 40%
  if (currentProfile.skills?.length > 0 && targetProfile.skills?.length > 0) {
    const commonSkills = currentProfile.skills.filter((skill: string) =>
      targetProfile.skills.includes(skill)
    );
    score += (commonSkills.length / currentProfile.skills.length) * 40;
  }

  // Interests match -> weight 25%
  if (currentProfile.interests?.length > 0 && targetProfile.interests?.length > 0) {
    const commonInterests = currentProfile.interests.filter((interest: string) =>
      targetProfile.interests.includes(interest)
    );
    score += (commonInterests.length / currentProfile.interests.length) * 25;
  }

  // Same location -> weight 15%
  if (currentProfile.location && targetProfile.location &&
    currentProfile.location.toLowerCase() === targetProfile.location.toLowerCase()) {
    score += 15;
  }

  // Same availability -> weight 20%
  if (currentProfile.availability && targetProfile.availability &&
    currentProfile.availability === targetProfile.availability) {
    score += 20;
  }

  return Math.round(score);
};

export const getPeople = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      search,
      skills,
      availability,
      location,
      page = 1,
      limit = 10,
      sort = "createdAt",
    } = req.query as any;

    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};

    // search in skills / interests / location
    if (search) {
      where[Op.or] = [
        { location: { [Op.iLike]: `%${search}%` } },
        { skills: { [Op.overlap]: [search] } },
        { interests: { [Op.overlap]: [search] } },
      ];
    }

    // skills filter
    if (skills) {
      const skillArray = skills.split(",");
      where.skills = {
        [Op.overlap]: skillArray,
      };
    }

    // availability filter
    if (availability) {
      where.availability = availability;
    }

    // location filter
    if (location) {
      where.location = {
        [Op.iLike]: `%${location}%`,
      };
    }

    const allProfiles = await Profile.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email"],
        },
      ],
      attributes: [
        "id",
        "userId",
        "fullName",
        "headline",
        "location",
        "availability",
        "avatar",
        "skills",
        "interests",
        "createdAt" // Added for fallback sorting
      ],
    });

    const count = allProfiles.length;

    const loggedInUserId = (req as any).user?.id;
    let currentUserProfile: any = null;
    const connectedUserIds = new Set<number>();

    if (loggedInUserId) {
      currentUserProfile = await Profile.findOne({ where: { userId: loggedInUserId } });

      // Identify Tier 1 connections
      const [myProjects, myCollabs] = await Promise.all([
        Project.findAll({ where: { userId: loggedInUserId }, attributes: ['id'] }),
        Collaboration.findAll({
          where: { userId: loggedInUserId, status: 'approved' },
          include: [{ model: Project, as: 'project', attributes: ['userId'] }]
        })
      ]);

      const myProjectIds = myProjects.map(p => p.id);
      if (myProjectIds.length > 0) {
        const collaboratorsOnMyProjects = await Collaboration.findAll({
          where: { projectId: { [Op.in]: myProjectIds }, status: 'approved' },
          attributes: ['userId']
        });
        collaboratorsOnMyProjects.forEach(c => connectedUserIds.add(c.userId));
      }

      myCollabs.forEach((c: any) => {
        if (c.project) connectedUserIds.add(c.project.userId);
      });
    }

    const data = allProfiles.map((row: any) => {
      const profile = row.toJSON();

      // Calculate matchScore
      let matchScore = 0;
      if (currentUserProfile && profile.userId !== loggedInUserId) {
        matchScore = calculateMatchScore(currentUserProfile, profile);
      } else if (profile.userId === loggedInUserId) {
        matchScore = 100;
      }

      // Calculate tier
      const tier = connectedUserIds.has(profile.userId) ? 1 : 2;

      return {
        ...profile,
        matchScore,
        tier,
      };
    });

    // Custom sorting: Tier 1 first, then highest Match Score
    data.sort((a, b) => {
      // 1. Sort by tier (ascending: Tier 1 before Tier 2)
      if (a.tier !== b.tier) {
        return a.tier - b.tier;
      }

      // 2. Sort by matchScore (descending: highest score first)
      if (a.matchScore !== b.matchScore) {
        return b.matchScore - a.matchScore;
      }

      // 3. Fallback to default sort by createdAt DESC
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      return 0;
    });

    // Apply pagination in memory
    const paginatedData = data.slice(offset, offset + Number(limit));

    return res.status(200).json({
      success: true,
      total: count,
      page: Number(page),
      limit: Number(limit),
      data: paginatedData,
    });
  } catch (error) {
    next(error);
  }
};