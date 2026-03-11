import { Request, Response, NextFunction } from 'express';
import { ErrorLog } from '../modules/errors/error.model';
import { ApiResponse } from '../utils/response';

export const globalErrorHandler = async (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Something went wrong';

    try {
        // Log error to Database
        await ErrorLog.create({
            message: message,
            stack: err.stack,
            path: req.originalUrl,
            method: req.method,
            userId: (req as any).user?.id || null, // Capture user ID if auth middleware is used
            body: req.body,
        });
    } catch (logError) {
        console.error('Failed to log error to DB:', logError);
    }

    // Console log for development
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);

    return res.status(statusCode).json(ApiResponse.error(message, err.errors || null));
};
