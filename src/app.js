import express from "express";
import config from "./config/index.js";
import sequelize, { connectDB } from "./config/db.js";
import models from "./models/index.js";
import errorHandler from "./middlewares/errorHandler.js";
import authRoutes from "./routes/auth.js";
import cors from "cors";

//init express app
const app = express();
const corsOptions = {
  origin: "http://localhost:59940",
};

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

//routes
app.get("/api/health", (req, res) => {
  res.json({ status: "API is running fine and healthy" });
});

app.use("/api/auth", authRoutes);

// route defaults
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Route does not exist" });
});

app.use(errorHandler);

//start server
await connectDB();

app.listen(config.PORT, () => {
  console.log(`Server is running on port ${config.PORT}`);
});
