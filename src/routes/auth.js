import express from "express";
import { loginUser, registerUser } from "../controllers/authController.js";
import { registrationValidator, loginValidator } from "../utils/Validators.js";
import validationMiddleware from "../middlewares/validationMiddleware.js";

const router = express.Router();

router.post(
  "/register",
  registrationValidator,
  validationMiddleware,
  registerUser
);
router.post("/login", loginValidator, validationMiddleware, loginUser);

export default router;
