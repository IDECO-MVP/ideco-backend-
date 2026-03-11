import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../database";

export class ErrorLog extends Model {
    public id!: number;
    public message!: string;
    public stack!: string;
    public path!: string;
    public method!: string;
    public userId?: number;
    public body?: any;
    public readonly createdAt!: Date;
}

ErrorLog.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        stack: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        path: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        method: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        body: {
            type: DataTypes.JSON,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: "ErrorLog",
        tableName: "errorLogs",
        timestamps: true,
        updatedAt: false,
    }
);
