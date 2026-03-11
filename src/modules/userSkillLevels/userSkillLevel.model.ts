import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../database";
import { User } from "../users/user.model";

export enum SkillLevel {
    EXPERT = "Expert",
    ADVANCED = "Advanced",
    MASTER = "Master",
    PROFESSIONAL = "Professional"
}

export class UserSkillLevel extends Model {
    public id!: number;
    public userId!: number;
    public name!: string;
    public level!: SkillLevel;

    // timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

UserSkillLevel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        level: {
            type: DataTypes.ENUM(...Object.values(SkillLevel)),
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: "UserSkillLevel",
        tableName: "user_skill_levels",
        timestamps: true,
    }
);

// Define Association
User.hasMany(UserSkillLevel, { foreignKey: 'userId', as: 'skillLevels' });
UserSkillLevel.belongsTo(User, { foreignKey: 'userId', as: 'user' });
