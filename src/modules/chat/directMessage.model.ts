import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../database';
import { User } from '../users/user.model';

/**
 * DirectMessage – a conversation thread between exactly two users.
 * The pair (user1Id, user2Id) is unique; user1Id < user2Id by convention.
 */
export class DirectMessage extends Model {
    public id!: number;
    public user1Id!: number;
    public user2Id!: number;

    // timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // associations
    public user1!: User;
    public user2!: User;
}

DirectMessage.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        user1Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        user2Id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
    },
    {
        sequelize,
        modelName: 'DirectMessage',
        tableName: 'direct_messages',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['user1Id', 'user2Id'],
            },
        ],
    }
);

// Associations
User.hasMany(DirectMessage, { foreignKey: 'user1Id', as: 'directMessagesAsUser1' });
User.hasMany(DirectMessage, { foreignKey: 'user2Id', as: 'directMessagesAsUser2' });
DirectMessage.belongsTo(User, { foreignKey: 'user1Id', as: 'user1' });
DirectMessage.belongsTo(User, { foreignKey: 'user2Id', as: 'user2' });
