import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './user.model';
import { Profile } from '../profiles/profile.model';
import { ApiResponse } from '../../utils/response';

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { fullName, email, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json(ApiResponse.error('User already exists'));
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            email,
            password: hashedPassword,
        });

        // Create profile
        await Profile.create({
            userId: user.id,
            fullName,
        });

        const userResponse = user.toJSON();
        delete userResponse.password;

        // Add fullName back to response to keep fields as they are for the client
        (userResponse as any).fullName = fullName;

        return res.status(201).json(ApiResponse.success('User registered successfully', userResponse));
    } catch (error: any) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({
            where: { email },
            include: [{ model: Profile, as: 'profile' }]
        });

        if (!user) {
            return res.status(401).json(ApiResponse.error('Invalid email or password'));
        }

        // Compare password
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json(ApiResponse.error('Invalid email or password'));
        }

        // Generate Token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        const userResponse = user.toJSON();
        delete userResponse.password;

        // Add fullName back to response to keep fields as they are for the client
        if ((user as any).profile) {
            (userResponse as any).fullName = (user as any).profile.fullName;
            delete userResponse.profile;
        }

        return res.status(200).json(ApiResponse.success('Login successful', { user: userResponse, token }));
    } catch (error: any) {
        next(error);
    }
};
