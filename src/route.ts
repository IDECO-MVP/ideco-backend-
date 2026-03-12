import { Router } from 'express';
import userRoute from './modules/users/user.route';
import errorRoute from './modules/errors/error.route';
import profileRoute from './modules/profiles/profile.route';
import postRoute from './modules/posts/post.route';
import projectRoute from './modules/projects/project.route';
import collaborationRoute from './modules/collaborations/collaboration.route';
import userSkillLevelRoute from './modules/userSkillLevels/userSkillLevel.route';
import taskRoute from './modules/tasks/task.route';

import featuredWorkRoute from './modules/featuredWorks/featuredWork.route';
import discussionRoute from './modules/discussions/discussion.route';

const router = Router();

// Combine all module routes here
router.use('/users', userRoute);
router.use('/errors', errorRoute);
router.use('/profiles', profileRoute);
router.use('/posts', postRoute);
router.use('/projects', projectRoute);
router.use('/collaborations', collaborationRoute);
router.use('/user-skill-levels', userSkillLevelRoute);
router.use('/tasks', taskRoute);
router.use('/featured-works', featuredWorkRoute);
router.use('/discussions', discussionRoute);

export default router;
