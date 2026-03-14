import { Request, Response } from 'express';
import { ApiResponse } from '../../utils/response';
import { CommunityEvent } from './communityEvent.model';
import { Community } from './community.model';
import { User } from '../users/user.model';
import { Profile } from '../profiles/profile.model';

const includeCreator = {
    model: User,
    as: 'creator',
    attributes: ['id'],
    include: [
        {
            model: Profile,
            as: 'profile',
            attributes: ['fullName', 'avatar']
        }
    ]
};

export const createEvent = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { communityId, title, description, eventDate, tag } = req.body;

        const community = await Community.findByPk(Number(communityId));
        if (!community) {
            return res.status(404).json(ApiResponse.error('Community not found'));
        }

        const event = await CommunityEvent.create({
            communityId: Number(communityId),
            title,
            description,
            eventDate,
            tag,
            createdBy: userId
        });

        return res.status(201).json(ApiResponse.success('Event created successfully', event));
    } catch (error: any) {
        return res.status(500).json(ApiResponse.error('Error creating event', error.message));
    }
};

export const getEventsByCommunityId = async (req: Request, res: Response) => {
    try {
        const { communityId } = req.params;

        const events = await CommunityEvent.findAll({
            where: { communityId: Number(communityId) },
            order: [['eventDate', 'ASC']],
            include: [includeCreator]
        });

        const formatted = events.map((event: any) => {
            const json = event.toJSON();

            json.creator = {
                id: json.creator?.id,
                fullName: json.creator?.profile?.fullName || null,
                avatar: json.creator?.profile?.avatar || null
            };

            return json;
        });

        return res.status(200).json(ApiResponse.success('Events fetched successfully', formatted));
    } catch (error: any) {
        return res.status(500).json(ApiResponse.error('Error fetching events', error.message));
    }
};

export const deleteEvent = async (req: Request, res: Response) => {
    try {
        const { eventId } = req.params;
        const userId = (req as any).user.id;

        const event = await CommunityEvent.findByPk(Number(eventId));
        if (!event) {
            return res.status(404).json(ApiResponse.error('Event not found'));
        }

        if (event.createdBy !== userId) {
            return res.status(403).json(ApiResponse.error('Forbidden: You can only delete your own events'));
        }

        await event.destroy();

        return res.status(200).json(ApiResponse.success('Event deleted successfully', null));
    } catch (error: any) {
        return res.status(500).json(ApiResponse.error('Error deleting event', error.message));
    }
};