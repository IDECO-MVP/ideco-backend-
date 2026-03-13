import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../database";
import { User } from "../users/user.model";
import { Post } from "./post.model";

export class PostSave extends Model {
    public id!: number;
    public postId!: number;
    public userId!: number;

    // timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

PostSave.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        postId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'posts',
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
    },
    {
        sequelize,
        modelName: "PostSave",
        tableName: "post_saves",
        timestamps: true,
    }
);

// Define Associations
Post.hasMany(PostSave, { foreignKey: 'postId', as: 'saves' });
PostSave.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

User.hasMany(PostSave, { foreignKey: 'userId', as: 'postSaves' });
PostSave.belongsTo(User, { foreignKey: 'userId', as: 'user' });
