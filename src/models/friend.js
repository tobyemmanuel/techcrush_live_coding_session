import sequelize from "../config/db.js";
import { DataTypes } from "sequelize";

const Friend = sequelize.define(
  "Friend",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    friend_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "declined"),
      defaultValue: "pending",
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "friend_id"],
      },
    ],
  }
);

export default Friend;
