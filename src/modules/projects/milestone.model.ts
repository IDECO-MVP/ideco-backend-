import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../database";
import { Project } from "./project.model";

export class Milestone extends Model {
    public id!: number;
    public projectId!: number;
    public name!: string;
    public target!: Date;

    // timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Milestone.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        projectId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'projects',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        target: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: "Milestone",
        tableName: "milestones",
        timestamps: true,
    }
);

// Define Associations
Project.hasMany(Milestone, { foreignKey: 'projectId', as: 'milestones', onDelete: 'CASCADE' });
Milestone.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
