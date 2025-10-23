import AppError from "../utils/appError.js";
import { createUser } from "../services/userService.js";

async function registerUser(req, res) {
  try {
    const {
      username,
      email,
      password,
      gender,
      phoneNumber,
      role = "user",
    } = req.body;
    await createUser({ username, email, password, gender, phoneNumber, role });
    res.status(201).json({ success: true, message: "User registered" });
  } catch (error) {
    throw new AppError(error || "Registration failed", 400);
  }
}

function loginUser(req, res) {
  // Login logic here
  res.send("User logged in");
}

function changePassword(req, res) {
  // Change password logic here
  res.send("Password changed");
}

function getEmailOTP(req, res) {
  // Get email OTP logic here
  res.send("Email OTP sent");
}

function verifyEmailOTP(req, res) {
  // Verify email OTP logic here
  res.send("Email OTP verified");
}

export { registerUser, loginUser, changePassword, getEmailOTP, verifyEmailOTP };
