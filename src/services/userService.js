import User from "../models/user.js";
import utils from "../utils/Auth.js";
// import cache from "./cacheService.js";
import cache from "../config/cache.js";

async function createUser(userData) {
  const checkEmailExists = await User.findOne({
    where: { email: userData.email },
  });
  if (checkEmailExists) throw new Error("Email already exists");

  const checkUsernameExists = await User.findOne({
    where: { username: userData.username },
  });
  if (checkUsernameExists) throw new Error("User already exists");

  const newUser = await User.create(userData);

  return newUser;
}

async function logUserIntoApp(loginCredentials) {
  const user = await User.findOne({
    where: { email: loginCredentials.email },
  });

  if (!user) throw new Error("Invalid Email or Password");

  const isPasswordValid = await user.verifyPassword(loginCredentials.password);

  if (!isPasswordValid) throw new Error("Invalid Email or Password");

  const token = await utils.generateToken(user);
  const refreshToken = await utils.generateRefreshToken(user, token);

  return {
    userUUID: user.user_uuid,
    email: user.email,
    username: user.username,
    phone: user.phoneNumber || null,
    profilePicture: user.profilePicture || null,
    role: user.role,
    gender: user.gender,
    token,
    refreshToken,
  };
}

async function logUserOutOfApp() {
  // Logic for logging out user (e.g., invalidating tokens) can be added here
}

async function refreshUserToken(refreshToken) {
  const decoded = await utils.verifyRefreshToken(refreshToken);
  const user = await User.findOne({ where: { user_uuid: decoded.id } });

  if (!user) throw new Error("User not found");

  const newToken = await utils.generateToken(user);
  const newRefreshToken = await utils.generateRefreshToken(user, newToken);

  return {
    token: newToken,
    refreshToken: newRefreshToken,
  };
}

async function getUserProfile(userUUID) {
  if (cache) {
    const cachedProfile = await cache.get(`userProfile:${userUUID}`);
    if (cachedProfile) {
      return JSON.parse(cachedProfile);
    }
  }

  const user = await User.findOne({ where: { user_uuid: userUUID } });
  if (!user) throw new Error("User not found");
  delete user.dataValues.password;

  if (cache) {
    await cache.set(`userProfile:${userUUID}`, JSON.stringify(user), 3600); // Cache for 1 hour
  }

  return user;
}

export { createUser, logUserIntoApp, getUserProfile };
