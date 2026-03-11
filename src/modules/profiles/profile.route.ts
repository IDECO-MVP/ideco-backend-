import { Router } from 'express';
import { getMyProfile, createProfile, updateProfile, getProfileByUserId } from './profile.controller';
import { authMiddleware } from '../../middleware/auth';
import { upload } from '../../middleware/upload';

const router = Router();

// All profile routes are protected
router.use(authMiddleware);

router.get('/me', getMyProfile);

router.get('/users/:userId', getProfileByUserId);

// Multipart upload for avatar and coverImage
const profileUpload = upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
]);

router.post('/', profileUpload, createProfile);
router.put('/', profileUpload, updateProfile);

export default router;
