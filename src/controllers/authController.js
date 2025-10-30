import AppError from "../utils/AppError.js";
import {
  createUser,
  logUserIntoApp,
  getUserProfile,
} from "../services/userService.js";

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

async function loginUser(req, res) {
  try {
    console.log("Login request body:", req.body);
    const { email, password } = req.body;
    const user = await logUserIntoApp({ email, password });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    throw new AppError(error || "Invalid Email or Password", 401);
  }
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

async function userProfile(req, res) {
  try {
    const userUUID = req.user.user_uuid;
    const profile = await getUserProfile(userUUID);
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    throw new AppError(error || "Invalid User", 401);
  }
}

export { registerUser, loginUser, changePassword, getEmailOTP, verifyEmailOTP, userProfile };
