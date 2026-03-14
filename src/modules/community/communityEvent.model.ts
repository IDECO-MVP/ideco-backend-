import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../database';
import { Community } from './community.model';
import { User } from '../users/user.model';

export class CommunityEvent extends Model {
    public id!: number;
    public communityId!: number;
    public title!: string;
    public description!: string;
    public eventDate!: Date;
    public tag!: string;
    public createdBy!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

CommunityEvent.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

        communityId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'communities', key: 'id' }
        },

        title: {
            type: DataTypes.STRING,
            allowNull: false
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },

        eventDate: {
            type: DataTypes.DATE,
            allowNull: false
        },

        tag: {
            type: DataTypes.STRING
        },

        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' }
        }
    },
    {
        sequelize,
        modelName: 'CommunityEvent',
        tableName: 'communityEvents',
        timestamps: true
    }
);

CommunityEvent.belongsTo(Community, { foreignKey: 'communityId', as: 'community' });
Community.hasMany(CommunityEvent, { foreignKey: 'communityId', as: 'events' });

CommunityEvent.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(CommunityEvent, { foreignKey: 'createdBy', as: 'createdEvents' });