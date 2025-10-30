import { Sequelize } from "sequelize";
import config from "./index.js";
import process from "node:process";

const sequelize = new Sequelize(
  config.DATABASE_NAME,
  config.DATABASE_USERNAME,
  config.DATABASE_PASSWORD,
  {
    dialect: config.DATABASE_DIALECT,
    port: config.DATABASE_PORT,
    host: config.DATABASE_HOST,
    logging: (msg) => console.log(msg),
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    // await sequelize.sync({ alter: true });
    console.log("Database connected");
  } catch (error) {
    console.log("Database error:", error);
    process.exit(1);
  }
};

export default sequelize;
