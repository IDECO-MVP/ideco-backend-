import app from './app';
import { connectDB, sequelize } from './database';
import './modules/users/user.model';
import './modules/errors/error.model';
import './modules/profiles/profile.model';
import './modules/posts/post.model';
import './modules/projects/project.model';
import './modules/collaborations/collaboration.model';
import './modules/userSkillLevels/userSkillLevel.model';
import './modules/tasks/task.model';
import './modules/featuredWorks/featuredWork.model';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Connect to Database
        await connectDB();

        // Sync models (creates tables if they don't exist)
        // In production, you might want to use migrations instead
        await sequelize.sync({ alter: false }); // Use alter: true cautiously in dev, false or migrations in prod
        console.log('Database synced successfully');

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
};

startServer();
