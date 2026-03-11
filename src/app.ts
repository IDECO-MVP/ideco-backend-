import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './route';
import { ApiResponse } from './utils/response';
import { globalErrorHandler } from './middleware/error';

const app: Application = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Route
app.get('/', (req: Request, res: Response) => {
    res.json(ApiResponse.success('Welcome to IDECO Backend API', {}));
});

// API Routes
app.use('/api', routes);

// DB Sync Route (Admin/Dev Utility)
app.get('/sync-db', async (req: Request, res: Response) => {
    try {
        const { sequelize } = await import('./database');
        // alter: true will check the current state of the table in the DB 
        // and then perform the necessary changes in the table to make it match the model.
        await sequelize.sync({ alter: true });
        res.json(ApiResponse.success('Database synced successfully with models', {}));
    } catch (error: any) {
        res.status(500).json(ApiResponse.error('Database sync failed: ' + error.message));
    }
});

// Global Error Handler (Must be last)
app.use(globalErrorHandler);

// 404 Handler
app.use((req: Request, res: Response) => {
    res.status(404).json(ApiResponse.error('Route not found'));
});

export default app;
