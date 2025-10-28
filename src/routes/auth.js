import express from "express";
import { loginUser, registerUser, userProfile } from "../controllers/authController.js";
import { registrationValidator, loginValidator } from "../utils/Validators.js";
import validationMiddleware from "../middlewares/validationMiddleware.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post(
  "/register",
  registrationValidator,
  validationMiddleware,
  registerUser
);
router.post("/login", loginValidator, validationMiddleware, loginUser);
router.get("/profile", authMiddleware, userProfile);

export default router;
