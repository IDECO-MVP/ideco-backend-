import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../database";
import { Project } from "../projects/project.model";
import { User } from "../users/user.model";

export class Collaboration extends Model {
    public id!: number;
    public projectId!: number;
    public userId!: number;
    public status!: 'pending' | 'approved' | 'rejected';

    // Virtual field for association
    public project!: Project;
    public user!: User;

    // timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Collaboration.init(
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
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending',
        },
    },
    {
        sequelize,
        modelName: "Collaboration",
        tableName: "project_collaborations",
        timestamps: true,
    }
);

// Define Associations
Project.hasMany(Collaboration, { foreignKey: 'projectId', as: 'collaborations' });
Collaboration.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

User.hasMany(Collaboration, { foreignKey: 'userId', as: 'collaborations' });
Collaboration.belongsTo(User, { foreignKey: 'userId', as: 'user' });
