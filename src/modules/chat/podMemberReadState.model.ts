import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../../database';
import { WorkspacePodMember } from './workspacePodMember.model';
import { Message } from './message.model';

/**
 * PodMemberReadState – tracks the last message each pod member has read.
 * Unread count = # messages in pod with id > lastReadMessageId.
 */
export class PodMemberReadState extends Model {
    public id!: number;
    public podMemberId!: number;
    public lastReadMessageId!: number | null;

    // timestamps
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

PodMemberReadState.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        podMemberId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'workspace_pod_members',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        lastReadMessageId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'messages',
                key: 'id',
            },
            onDelete: 'SET NULL',
        },
    },
    {
        sequelize,
        modelName: 'PodMemberReadState',
        tableName: 'pod_member_read_states',
        timestamps: true,
    }
);

WorkspacePodMember.hasOne(PodMemberReadState, { foreignKey: 'podMemberId', as: 'readState' });
PodMemberReadState.belongsTo(WorkspacePodMember, { foreignKey: 'podMemberId', as: 'podMember' });

Message.hasMany(PodMemberReadState, { foreignKey: 'lastReadMessageId', as: 'readStates' });
PodMemberReadState.belongsTo(Message, { foreignKey: 'lastReadMessageId', as: 'lastReadMessage' });
