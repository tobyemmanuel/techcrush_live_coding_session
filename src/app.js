import express from "express";
import config from "./config/index.js";
import sequelize, { connectDB } from "./config/db.js";
import models from "./models/index.js";
//init express app
const app = express();

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//routes
app.get("/health", (req, res) => {
  res.json({ status: "API is running fine and healthy" });
});

//start server
await sequelize.sync({ alter: true });
await connectDB();

app.listen(config.PORT, () => {
  console.log(`Server is running on port ${config.PORT}`);
});
