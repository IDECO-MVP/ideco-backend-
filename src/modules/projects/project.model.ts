import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../database";
import { User } from "../users/user.model";

export class Project extends Model {
    public id!: number;
    public image!: string;
    public title!: string;
    public status!: string;
    public description!: string;
    public skills!: string[];
    public userId!: number;
    public addInFeuturedWork!: boolean;
    public link!: string;
    public seekings!: string[];
    public opened!: boolean;

    public communityId!: number;
    public category!: string;

    // timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Project.init(
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
        communityId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null,
        },
        category: {
            type: DataTypes.STRING,
            allowNull: true,
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
        addInFeuturedWork: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
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
        modelName: "Project",
        tableName: "projects",
        timestamps: true,
    }
);

// Define Association
User.hasMany(Project, { foreignKey: 'userId', as: 'projects' });
Project.belongsTo(User, { foreignKey: 'userId', as: 'user' });

