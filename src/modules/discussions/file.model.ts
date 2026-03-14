import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../database";
import { User } from "../users/user.model";
import { Project } from "../projects/project.model";

export class File extends Model {
    public id!: number;
    public file!: string | null;
    public projectId!: number;
    public userId!: number;

    // timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

File.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
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
        modelName: "File",
        tableName: "files",
        timestamps: true,
    }
);

// Define Associations
Project.hasMany(File, { foreignKey: "projectId", as: "Files" });
File.belongsTo(Project, { foreignKey: "projectId", as: "project" });

User.hasMany(File, { foreignKey: "userId", as: "Files" });
File.belongsTo(User, { foreignKey: "userId", as: "user" });
