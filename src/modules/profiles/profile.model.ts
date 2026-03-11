import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../database";
import { User } from "../users/user.model";

export class Profile extends Model {
    public id!: number;
    public userId!: number;
    public fullName!: string | null;
    public headline!: string | null;
    public bio!: string | null;
    public location!: string | null;
    public website!: string | null;
    public avatar!: string | null;
    public coverImage!: string | null;
    public languages!: string[] | null;
    public skills!: string[] | null;
    public interests!: string[] | null;

    // timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Profile.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        fullName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        headline: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        bio: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        location: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        website: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        avatar: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        coverImage: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        languages: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
        },
        skills: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            defaultValue: [],
        },
        interests: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            defaultValue: [],
        },
    },
    {
        sequelize,
        modelName: "Profile",
        tableName: "profiles",
        timestamps: true,
    }
);

// Define Association
User.hasOne(Profile, { foreignKey: 'userId', as: 'profile' });
Profile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
