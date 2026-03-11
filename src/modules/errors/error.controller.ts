import { Request, Response, NextFunction } from 'express';
import { ErrorLog } from './error.model';
import { ApiResponse } from '../../utils/response';

export const getAllErrors = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = await ErrorLog.findAll({
            order: [['createdAt', 'DESC']],
            limit: 100 // Get latest 100 errors
        });

        return res.status(200).json(ApiResponse.success('Errors fetched successfully', errors));
    } catch (error: any) {
        next(error);
    }
};

export const getErrorById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const errorLog = await ErrorLog.findByPk(Number(id));

        if (!errorLog) {
            return res.status(404).json(ApiResponse.error('Error log not found'));
        }

        return res.status(200).json(ApiResponse.success('Error log fetched successfully', errorLog));
    } catch (error: any) {
        next(error);
    }
};
