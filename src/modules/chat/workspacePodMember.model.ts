import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../database';
import { User } from '../users/user.model';
import { WorkspacePod } from './workspacePod.model';

/**
 * WorkspacePodMember – tracks who is in a workspace pod.
 * The project owner + all approved collaborators are members.
 */
export class WorkspacePodMember extends Model {
    public id!: number;
    public podId!: number;
    public userId!: number;

    // timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // associations
    public pod!: WorkspacePod;
    public user!: User;
}

WorkspacePodMember.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        podId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'workspace_pods',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
    },
    {
        sequelize,
        modelName: 'WorkspacePodMember',
        tableName: 'workspace_pod_members',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['podId', 'userId'], // prevent duplicate memberships
            },
        ],
    }
);

// Associations
WorkspacePod.hasMany(WorkspacePodMember, { foreignKey: 'podId', as: 'members' });
WorkspacePodMember.belongsTo(WorkspacePod, { foreignKey: 'podId', as: 'pod' });

User.hasMany(WorkspacePodMember, { foreignKey: 'userId', as: 'podMemberships' });
WorkspacePodMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
