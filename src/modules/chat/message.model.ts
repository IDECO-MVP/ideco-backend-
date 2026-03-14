import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../database';
import { User } from '../users/user.model';
import { WorkspacePod } from './workspacePod.model';
import { DirectMessage } from './directMessage.model';

export type MessageContext = 'pod' | 'dm';

/**
 * Message – stores individual chat messages.
 * Can belong to either a WorkspacePod (group) or a DirectMessage (1-to-1).
 * Exactly one of (podId, dmId) must be set.
 */
export class Message extends Model {
    public id!: number;
    public senderId!: number;
    public podId!: number | null;
    public dmId!: number | null;
    public context!: MessageContext;
    public content!: string;
    public isRead!: boolean;   // for DMs – true once the recipient has read it

    // timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // associations
    public sender!: User;
    public pod!: WorkspacePod;
    public dm!: DirectMessage;
}

Message.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        podId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'workspace_pods',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        dmId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'direct_messages',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        context: {
            type: DataTypes.ENUM('pod', 'dm'),
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        isRead: {
            // For DMs: marks whether the recipient has read it
            // For pods: always true (per-member unread tracked separately via last-read logic)
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        sequelize,
        modelName: 'Message',
        tableName: 'messages',
        timestamps: true,
    }
);

// Associations
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

WorkspacePod.hasMany(Message, { foreignKey: 'podId', as: 'messages' });
Message.belongsTo(WorkspacePod, { foreignKey: 'podId', as: 'pod' });

DirectMessage.hasMany(Message, { foreignKey: 'dmId', as: 'messages' });
Message.belongsTo(DirectMessage, { foreignKey: 'dmId', as: 'dm' });
