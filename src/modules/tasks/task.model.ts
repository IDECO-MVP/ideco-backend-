import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../database";
import { User } from "../users/user.model";
import { Project } from "../projects/project.model";

export class Task extends Model {
    public id!: number;
    public title!: string;
    public description!: string;
    public status!: string;
    public priority!: string;
    public dueDate!: Date;
    public projectId!: number;
    public assignedTo!: number;

    // timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Task.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM("todo", "in-progress", "completed", "on-hold"),
            allowNull: false,
            defaultValue: "todo",
        },
        priority: {
            type: DataTypes.ENUM("low", "medium", "high", "urgent"),
            allowNull: false,
            defaultValue: "medium",
        },
        dueDate: {
            type: DataTypes.DATE,
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
        assignedTo: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: "users",
                key: "id",
            },
        },
    },
    {
        sequelize,
        modelName: "Task",
        tableName: "tasks",
        timestamps: true,
    }
);

// Define Association
Project.hasMany(Task, { foreignKey: "projectId", as: "tasks" });
Task.belongsTo(Project, { foreignKey: "projectId", as: "project" });

User.hasMany(Task, { foreignKey: "assignedTo", as: "tasks" });
Task.belongsTo(User, { foreignKey: "assignedTo", as: "assignedUser" });
