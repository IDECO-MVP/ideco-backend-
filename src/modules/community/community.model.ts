import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../database';
import { User } from '../users/user.model';

export class Community extends Model {
    public id!: number;
    public name!: string;
    public description!: string | null;
    public category!: string | null;
    public hashtags!: string[] | null;
    public tags!: string[] | null;
    public logoImage!: string | null;
    public coverImage!: string | null;
    public createdBy!: number;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Community.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        category: { type: DataTypes.STRING, allowNull: true },
        tags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
        hashtags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
        logoImage: { type: DataTypes.STRING, allowNull: true },
        coverImage: { type: DataTypes.STRING, allowNull: true },
        createdBy: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
    },
    { sequelize, modelName: 'Community', tableName: 'communities', timestamps: true }
);

Community.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Community, { foreignKey: 'createdBy', as: 'communities' });
