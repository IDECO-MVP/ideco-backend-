import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../database";
import { User } from "../users/user.model";

export class Post extends Model {
    public id!: number;
    public image!: string;
    public caption!: string;
    public hashtags!: string[];
    public milestoneBadge!: string;
    public userId!: number;

    // timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Post.init(
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
        caption: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        hashtags: {
            type: DataTypes.ARRAY(DataTypes.STRING),
            allowNull: true,
            defaultValue: [],
        },
        milestoneBadge: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
    },
    {
        sequelize,
        modelName: "Post",
        tableName: "posts",
        timestamps: true,
    }
);

// Define Association
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'user' });
