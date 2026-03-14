import { Op } from 'sequelize';
import { WorkspacePod } from './workspacePod.model';
import { WorkspacePodMember } from './workspacePodMember.model';
import { PodMemberReadState } from './podMemberReadState.model';
import { DirectMessage } from './directMessage.model';
import { Message } from './message.model';
import { User } from '../users/user.model';
import { Profile } from '../profiles/profile.model';
import { Project } from '../projects/project.model';

// ─── Shared include helper ─────────────────────────────────────────────────
const senderInclude = {
    model: User,
    as: 'sender',
    attributes: ['id', 'email'],
    include: [
        {
            model: Profile,
            as: 'profile',
            attributes: ['fullName', 'avatar', 'headline'],
        },
    ],
};

// ══════════════════════════════════════════════════════════════════════════════
// WORKSPACE POD SERVICES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Create a workspace pod when a project is created.
 * Also adds the project owner as the first member.
 */
export const createWorkspacePod = async (
    projectId: number,
    projectTitle: string,
    ownerId: number
): Promise<WorkspacePod> => {
    const pod = await WorkspacePod.create({
        projectId,
        name: projectTitle,
    });

    const member = await WorkspacePodMember.create({ podId: pod.id, userId: ownerId });

    // initialise read state for the owner
    await PodMemberReadState.create({ podMemberId: member.id, lastReadMessageId: null });

    return pod;
};

/**
 * Add a user to a workspace pod (called when collaboration is approved).
 */
export const addMemberToPod = async (
    projectId: number,
    userId: number
): Promise<WorkspacePodMember | null> => {
    const pod = await WorkspacePod.findOne({ where: { projectId } });
    if (!pod) return null;

    const [member, created] = await WorkspacePodMember.findOrCreate({
        where: { podId: pod.id, userId },
        defaults: { podId: pod.id, userId },
    });

    if (created) {
        await PodMemberReadState.create({ podMemberId: member.id, lastReadMessageId: null });
    }

    return member;
};

/**
 * Get a pod by project ID (with members and project info).
 */
export const getPodByProjectId = async (projectId: number) => {
    return WorkspacePod.findOne({
        where: { projectId },
        include: [
            {
                model: Project,
                as: 'project',
                attributes: ['id', 'title', 'status'],
            },
            {
                model: WorkspacePodMember,
                as: 'members',
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'email'],
                        include: [
                            {
                                model: Profile,
                                as: 'profile',
                                attributes: ['fullName', 'avatar', 'headline'],
                            },
                        ],
                    },
                ],
            },
        ],
    });
};

/**
 * Get all workspace pods a user belongs to.
 */
export const getUserPods = async (userId: number) => {
    const memberships = await WorkspacePodMember.findAll({
        where: { userId },
        include: [
            {
                model: WorkspacePod,
                as: 'pod',
                include: [
                    {
                        model: Project,
                        as: 'project',
                        attributes: ['id', 'title', 'status', 'image'],
                    },
                ],
            },
        ],
    });

    // Augment with unread counts
    const results = await Promise.all(
        memberships.map(async (membership) => {
            const readState = await PodMemberReadState.findOne({
                where: { podMemberId: membership.id },
            });

            const lastReadId = readState?.lastReadMessageId ?? 0;

            const unreadCount = await Message.count({
                where: {
                    podId: membership.podId,
                    context: 'pod',
                    id: { [Op.gt]: lastReadId },
                    senderId: { [Op.ne]: userId }, // don't count own messages
                },
            });

            // last message preview
            const lastMessage = await Message.findOne({
                where: { podId: membership.podId, context: 'pod' },
                order: [['createdAt', 'DESC']],
                include: [senderInclude],
            });

            return {
                pod: membership.pod,
                unreadCount,
                lastMessage,
            };
        })
    );

    return results;
};

/**
 * Get paginated message history for a pod.
 */
export const getPodMessages = async (
    podId: number,
    page = 1,
    limit = 50
) => {
    const offset = (page - 1) * limit;
    const { count, rows } = await Message.findAndCountAll({
        where: { podId, context: 'pod' },
        include: [senderInclude],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
    });

    return {
        messages: rows.reverse(), // chronological order
        total: count,
        page,
        pages: Math.ceil(count / limit),
    };
};

/**
 * Save a pod message to the database.
 */
export const savePodMessage = async (
    podId: number,
    senderId: number,
    content: string
): Promise<Message> => {
    const message = await Message.create({
        podId,
        senderId,
        context: 'pod',
        content,
        isRead: true, // pods use lastReadId model instead
    });

    // Return with sender populated
    return message.reload({ include: [senderInclude] });
};

/**
 * Mark all pod messages as read for a user (update lastReadMessageId).
 */
export const markPodMessagesRead = async (
    podId: number,
    userId: number
): Promise<void> => {
    const member = await WorkspacePodMember.findOne({ where: { podId, userId } });
    if (!member) return;

    const lastMessage = await Message.findOne({
        where: { podId, context: 'pod' },
        order: [['id', 'DESC']],
    });

    if (!lastMessage) return;

    await PodMemberReadState.upsert({
        podMemberId: member.id,
        lastReadMessageId: lastMessage.id,
    });
};

/**
 * Get unread count for a user in a specific pod.
 */
export const getPodUnreadCount = async (
    podId: number,
    userId: number
): Promise<number> => {
    const member = await WorkspacePodMember.findOne({ where: { podId, userId } });
    if (!member) return 0;

    const readState = await PodMemberReadState.findOne({ where: { podMemberId: member.id } });
    const lastReadId = readState?.lastReadMessageId ?? 0;

    return Message.count({
        where: {
            podId,
            context: 'pod',
            id: { [Op.gt]: lastReadId },
            senderId: { [Op.ne]: userId },
        },
    });
};

/**
 * Check if a user is a member of a pod.
 */
export const isPodMember = async (podId: number, userId: number): Promise<boolean> => {
    const member = await WorkspacePodMember.findOne({ where: { podId, userId } });
    return !!member;
};

// ══════════════════════════════════════════════════════════════════════════════
// DIRECT MESSAGE SERVICES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get or create a DM conversation between two users.
 * Enforces user1Id < user2Id for consistency.
 */
export const getOrCreateDmConversation = async (
    userAId: number,
    userBId: number
): Promise<DirectMessage> => {
    const user1Id = Math.min(userAId, userBId);
    const user2Id = Math.max(userAId, userBId);

    const [dm] = await DirectMessage.findOrCreate({
        where: { user1Id, user2Id },
        defaults: { user1Id, user2Id },
    });

    return dm;
};

/**
 * Get all DM conversations for a user with last message and unread count.
 */
export const getUserDmList = async (userId: number) => {
    const conversations = await DirectMessage.findAll({
        where: {
            [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
        },
        include: [
            {
                model: User,
                as: 'user1',
                attributes: ['id', 'email'],
                include: [{ model: Profile, as: 'profile', attributes: ['fullName', 'avatar', 'headline'] }],
            },
            {
                model: User,
                as: 'user2',
                attributes: ['id', 'email'],
                include: [{ model: Profile, as: 'profile', attributes: ['fullName', 'avatar', 'headline'] }],
            },
        ],
        order: [['updatedAt', 'DESC']],
    });

    const results = await Promise.all(
        conversations.map(async (dm) => {
            const unreadCount = await Message.count({
                where: {
                    dmId: dm.id,
                    context: 'dm',
                    senderId: { [Op.ne]: userId },
                    isRead: false,
                },
            });

            const lastMessage = await Message.findOne({
                where: { dmId: dm.id, context: 'dm' },
                order: [['createdAt', 'DESC']],
                include: [senderInclude],
            });

            // Determine the "other" user
            const otherUser = dm.user1Id === userId ? dm.user2 : dm.user1;

            return {
                dm,
                otherUser,
                unreadCount,
                lastMessage,
            };
        })
    );

    return results;
};

/**
 * Get paginated DM message history.
 */
export const getDmMessages = async (
    dmId: number,
    page = 1,
    limit = 50
) => {
    const offset = (page - 1) * limit;
    const { count, rows } = await Message.findAndCountAll({
        where: { dmId, context: 'dm' },
        include: [senderInclude],
        order: [['createdAt', 'DESC']],
        limit,
        offset,
    });

    return {
        messages: rows.reverse(),
        total: count,
        page,
        pages: Math.ceil(count / limit),
    };
};

/**
 * Save a DM message to the database.
 */
export const saveDmMessage = async (
    dmId: number,
    senderId: number,
    content: string
): Promise<Message> => {
    const message = await Message.create({
        dmId,
        senderId,
        context: 'dm',
        content,
        isRead: false,
    });

    // Bump DM conversation's updatedAt so it bubbles to top of list
    await DirectMessage.update({ updatedAt: new Date() } as any, { where: { id: dmId } });

    return message.reload({ include: [senderInclude] });
};

/**
 * Mark all unread DM messages as read for a user in a conversation.
 */
export const markDmMessagesRead = async (
    dmId: number,
    userId: number
): Promise<void> => {
    await Message.update(
        { isRead: true },
        {
            where: {
                dmId,
                context: 'dm',
                senderId: { [Op.ne]: userId },
                isRead: false,
            },
        }
    );
};

/**
 * Get total unread DM count for a user (across all conversations).
 */
export const getTotalDmUnreadCount = async (userId: number): Promise<number> => {
    return Message.count({
        where: {
            context: 'dm',
            senderId: { [Op.ne]: userId },
            isRead: false,
        },
        include: [
            {
                model: DirectMessage,
                as: 'dm',
                where: {
                    [Op.or]: [{ user1Id: userId }, { user2Id: userId }],
                },
            },
        ],
    });
};
