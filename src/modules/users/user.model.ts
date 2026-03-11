import { DataTypes, Model } from "sequelize";
import { sequelize } from "../../database";

export class User extends Model {
  public id!: number;
  public email!: string;
  public password!: string;
  // timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true, // createdAt and updatedAt in camelCase due to database.ts config
  }
);
