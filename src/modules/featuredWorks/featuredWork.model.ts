import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../database";
import { User } from "../users/user.model";
import { Project } from "../projects/project.model";

export class FeaturedWork extends Model {
    public id!: number;
    public image!: string;
    public title!: string;
    public status!: string;
    public description!: string;
    public skills!: string[];
    public userId!: number;
    public projectId!: number | null;
    public link!: string;
    public seekings!: string[];
    public opened!: boolean;

    // timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

FeaturedWork.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("completed", "inProgress", "ongoing"),
            allowNull: false,
            defaultValue: "ongoing",
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        skills: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            defaultValue: [],
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        projectId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'projects',
                key: 'id',
            },
        },
        link: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        seekings: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            defaultValue: [],
        },
        opened: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
        modelName: "FeaturedWork",
        tableName: "featured_works",
        timestamps: true,
    }
);

// Associations
User.hasMany(FeaturedWork, { foreignKey: 'userId', as: 'featuredWorks' });
FeaturedWork.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Project.hasOne(FeaturedWork, { foreignKey: 'projectId', as: 'featuredWork' });
FeaturedWork.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
