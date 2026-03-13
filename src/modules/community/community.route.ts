import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { optionalAuthMiddleware } from '../../middleware/optionalAuth';
import { upload } from '../../middleware/upload';
import {
    createCommunity,
    getCommunities,
    getCommunityById,
    updateCommunity,
    deleteCommunity,
    joinCommunity,
    leaveCommunity,
    getCommunityMembers,
    getJoinedCommunities,
    getPostsByCommunityId,
    getProjectsByCommunityId
} from './community.controller';

const router = Router();

// Community CRUD
router.post('/', authMiddleware, upload.fields([{ name: 'logoImage', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), createCommunity);
router.get('/', optionalAuthMiddleware, getCommunities);
router.get('/joined/me', authMiddleware, getJoinedCommunities);
router.get('/:communityId', optionalAuthMiddleware, getCommunityById);
router.put('/:communityId', authMiddleware, upload.fields([{ name: 'logoImage', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]), updateCommunity);
router.delete('/:communityId', authMiddleware, deleteCommunity);

// Join / Leave
router.post('/join/:communityId', authMiddleware, joinCommunity);
router.post('/leave/:communityId', authMiddleware, leaveCommunity);

// Members
router.get('/members/:communityId', optionalAuthMiddleware, getCommunityMembers);

// Posts
router.get('/posts/:communityId', optionalAuthMiddleware, getPostsByCommunityId);

// Projects
router.get('/projects/:communityId', optionalAuthMiddleware, getProjectsByCommunityId);

export default router;
