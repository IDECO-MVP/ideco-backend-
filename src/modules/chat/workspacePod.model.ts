import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../database';
import { Project } from '../projects/project.model';

/**
 * WorkspacePod – a group chat automatically created when a project is created.
 * One pod per project.
 */
export class WorkspacePod extends Model {
    public id!: number;
    public projectId!: number;
    public name!: string;

    // timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // associations
    public project!: Project;
}

WorkspacePod.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        projectId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true, // one pod per project
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
    },
    {
        sequelize,
        modelName: 'WorkspacePod',
        tableName: 'workspace_pods',
        timestamps: true,
    }
);

// Associations
Project.hasOne(WorkspacePod, { foreignKey: 'projectId', as: 'workspacePod' });
WorkspacePod.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
