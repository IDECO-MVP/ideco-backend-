import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../database";
import { User } from "../users/user.model";
import { Project } from "../projects/project.model";

export class Discussion extends Model {
    public id!: number;
    public message!: string;
    public file!: string | null;
    public projectId!: number;
    public userId!: number;

    // timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Discussion.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        file: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        projectId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "projects",
                key: "id",
            },
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
        },
    },
    {
        sequelize,
        modelName: "Discussion",
        tableName: "discussions",
        timestamps: true,
    }
);

// Define Associations
Project.hasMany(Discussion, { foreignKey: "projectId", as: "discussions" });
Discussion.belongsTo(Project, { foreignKey: "projectId", as: "project" });

User.hasMany(Discussion, { foreignKey: "userId", as: "discussions" });
Discussion.belongsTo(User, { foreignKey: "userId", as: "user" });
