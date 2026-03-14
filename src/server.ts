import app from './app';
import http from 'http';
import { connectDB, sequelize } from './database';
import { initSocket } from './socket/socket';

// Import All Models
import './modules/users/user.model';
import './modules/errors/error.model';
import './modules/profiles/profile.model';
import './modules/posts/post.model';
import './modules/posts/postLike.model';
import './modules/posts/postSave.model';
import './modules/posts/postComment.model';
import './modules/projects/project.model';
import './modules/projects/milestone.model';
import './modules/collaborations/collaboration.model';
import './modules/userSkillLevels/userSkillLevel.model';
import './modules/tasks/task.model';
import './modules/featuredWorks/featuredWork.model';
import './modules/community/community.model';
import './modules/community/communityMember.model';
import './modules/discussions/discussion.model';
import './modules/discussions/file.model';

// Chat Module Models
import './modules/chat/workspacePod.model';
import './modules/chat/workspacePodMember.model';
import './modules/chat/directMessage.model';
import './modules/chat/message.model';
import './modules/chat/podMemberReadState.model';

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const startServer = async () => {
    try {
        // Connect to Database
        await connectDB();

        // Sync models
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully');

        // Initialize Socket.IO
        initSocket(server);
        console.log('Socket.IO initialized');

        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
};

startServer();
