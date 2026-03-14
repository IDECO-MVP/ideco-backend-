import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../database';
import { User } from '../users/user.model';
import { Community } from './community.model';

export class CommunityMember extends Model {
    public id!: number;
    public communityId!: number;
    public userId!: number;
    public role!: string;
    public joinedAt!: Date;
    public lastSeenAt!: Date;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

CommunityMember.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        communityId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'communities', key: 'id' } },
        userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
        role: { type: DataTypes.ENUM('admin', 'member'), defaultValue: 'member' },
        joinedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        lastSeenAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { sequelize, modelName: 'CommunityMember', tableName: 'communityMembers', timestamps: true }
);

CommunityMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(CommunityMember, { foreignKey: 'userId', as: 'communityMemberships' });

CommunityMember.belongsTo(Community, { foreignKey: 'communityId', as: 'community' });
Community.hasMany(CommunityMember, { foreignKey: 'communityId', as: 'members' });
