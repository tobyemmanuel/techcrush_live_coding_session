import User from "../models/user.js";
import utils from "../utils/Auth.js";
// import cache from "./cacheService.js";
import cache from "../config/cache.js";
import fs from "fs/promises";
import path from "path";
import crypto from "node:crypto";
import { sendEmail, renderTemplate } from "./emailService.js";

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
  
  await sendLoginNotification(user);
  
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
  if (cache && cache.redis) {
    const cachedProfile = await cache.get(`userProfile:${userUUID}`);
    if (cachedProfile) {
      return JSON.parse(cachedProfile);
    }
  }

  const user = await User.findOne({ where: { user_uuid: userUUID } });
  if (!user) throw new Error("User not found");
  delete user.dataValues.password;

  if (cache && cache.redis) {
    await cache.set(`userProfile:${userUUID}`, JSON.stringify(user), 3600); // Cache for 1 hour
  }

  return user;
}

async function updateUserProfile(userUUID, requestData) {
  let tempFilePath = null;

  try {
    const user = await User.findOne({ where: { user_uuid: userUUID } });
    if (!user) throw new Error("User not found");

    const updateData = {};

    if (requestData.username) updateData.username = requestData.username;
    if (requestData.email) updateData.email = requestData.email;
    if (requestData.phoneNumber)
      updateData.phoneNumber = requestData.phoneNumber;
    if (requestData.gender) updateData.gender = requestData.gender;

    if (requestData.file) {
      tempFilePath = requestData.file.path;

      const avatarsDir = path.join("uploads", "avatars");
      await fs.mkdir(avatarsDir, { recursive: true });

      const filename = `${userUUID}-${Date.now()}${path.extname(
        requestData.file.originalname
      )}`;
      const permanentPath = path.join(avatarsDir, filename);

      await fs.rename(tempFilePath, permanentPath);
      tempFilePath = null;

      if (user.profilePicture) {
        await fs
          .unlink(user.profilePicture)
          .catch((err) =>
            console.error("Error deleting old profile picture:", err)
          );
      }

      updateData.profilePicture = permanentPath;
    }

    await user.update(updateData);

    // Reload user to get updated data
    await user.reload();

    const userResponse = user.toJSON();
    delete userResponse.password;

    if (cache && cache.redis) {
      const cacheKey = `userProfile:${userUUID}`;
      await cache.del(cacheKey);
      await cache.set(cacheKey, userResponse, 3600);
    }

    return userResponse;
  } catch (error) {
    if (tempFilePath) {
      await fs
        .unlink(tempFilePath)
        .catch((err) => console.error("Error deleting temp file:", err));
    }

    console.error("Error updating user profile:", error);

    throw new Error(error.message || "Unable to update profile");
  }
}

export async function changePassword(userUUID, currentPassword, newPassword) {
  try {
    const user = await User.findOne({ where: { user_uuid: userUUID } });
    if (!user) throw new Error("User not found");

    // Verify current password
    const isValidPassword = await user.verifyPassword(currentPassword);
    if (!isValidPassword) {
      throw new Error("Current password is incorrect");
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long");
    }

    if (currentPassword === newPassword) {
      throw new Error("New password must be different from current password");
    }

    // Update password (will be hashed by beforeUpdate hook)
    await user.update({ password: newPassword });

    // Send notification email
    await sendPasswordChangeNotification(user);

    // Invalidate any cached sessions or tokens
    if (cache && cache.redis) {
      await cache.del(`userProfile:${userUUID}`);
      await cache.del(`userSessions:${userUUID}`);
    }

    return { success: true, message: "Password changed successfully" };
  } catch (error) {
    console.error("Error changing password:", error);
    throw error;
  }
}

export async function requestPasswordReset(email) {
  try {
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    // Don't reveal if user exists for security
    if (!user) {
      return {
        success: true,
        message: "If an account exists, a reset link has been sent",
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Store token in cache (or you could add fields to User model)
    if (cache && cache.redis) {
      await cache.set(
        `passwordReset:${resetToken}`,
        JSON.stringify({ userUUID: user.user_uuid, email: user.email }),
        3600 // 1 hour TTL
      );
    }

    // Send reset email
    await sendPasswordResetEmail(user, resetToken);

    return {
      success: true,
      message: "If an account exists, a reset link has been sent",
    };
  } catch (error) {
    console.error("Error requesting password reset:", error);
    throw new Error("Unable to process password reset request");
  }
}

export async function resetPassword(token, newPassword) {
  try {
    // Validate new password
    if (newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long");
    }

    // Get user from token
    if (!cache || !cache.redis) {
      throw new Error("Password reset service unavailable");
    }

    const tokenData = await cache.get(`passwordReset:${token}`);
    if (!tokenData) {
      throw new Error("Invalid or expired reset token");
    }

    const { userUUID } = JSON.parse(tokenData);
    const user = await User.findOne({ where: { user_uuid: userUUID } });

    if (!user) {
      throw new Error("User not found");
    }

    // Update password
    await user.update({ password: newPassword });

    // Delete used token
    await cache.del(`passwordReset:${token}`);

    // Send confirmation email
    await sendPasswordResetConfirmation(user);

    // Invalidate sessions
    await cache.del(`userProfile:${userUUID}`);
    await cache.del(`userSessions:${userUUID}`);

    return { success: true, message: "Password reset successfully" };
  } catch (error) {
    console.error("Error resetting password:", error);
    throw error;
  }
}

async function sendLoginNotification(user) {
  const html = await renderTemplate("login-notification", {
    username: user.username,
    email: user.email,
    loginTime: new Date().toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
    }),
    location: "TechCrush City",
    device: "Backend Device",
  });

  const text = `Hello ${
    user.username
  },\n\nA login attempt was made o your account at ${new Date().toLocaleString()}.\n\nIf you did not make this attempt, please contact support immediately.`;

  await sendEmail(user.email, "Login Attempt", html, text);
}

async function sendPasswordChangeNotification(user) {
  const html = await renderTemplate("password-changed", {
    username: user.username,
    email: user.email,
    date: new Date().toLocaleString(),
  });

  const text = `Hello ${
    user.username
  },\n\nYour password was changed successfully on ${new Date().toLocaleString()}.\n\nIf you did not make this change, please contact support immediately.`;

  await sendEmail(user.email, "Password Changed Successfully", html, text);
}

async function sendPasswordResetEmail(user, token) {
  const resetUrl = `${
    process.env.FRONTEND_URL || "http://localhost:3000"
  }/reset-password?token=${token}`;

  const html = await renderTemplate("password-reset", {
    username: user.username,
    resetUrl,
    expiryTime: "1 hour",
  });

  const text = `Hello ${user.username},\n\nYou requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.`;

  await sendEmail(user.email, "Password Reset Request", html, text);
}

async function sendPasswordResetConfirmation(user) {
  const html = await renderTemplate("password-reset-confirmation", {
    username: user.username,
    date: new Date().toLocaleString(),
  });

  const text = `Hello ${
    user.username
  },\n\nYour password was reset successfully on ${new Date().toLocaleString()}.\n\nIf you did not make this change, please contact support immediately.`;

  await sendEmail(user.email, "Password Reset Successful", html, text);
}

export async function sendEmailChangeNotification(
  oldEmail,
  newEmail,
  username
) {
  const html = await renderTemplate("email-changed", {
    username,
    oldEmail,
    newEmail,
    date: new Date().toLocaleString(),
  });

  const text = `Hello ${username},\n\nYour email was changed from ${oldEmail} to ${newEmail} on ${new Date().toLocaleString()}.\n\nIf you did not make this change, please contact support immediately.`;

  // Send to OLD email
  await sendEmail(oldEmail, "Email Address Changed", html, text);

  // Send welcome to NEW email
  const welcomeHtml = await renderTemplate("email-change-confirmation", {
    username,
    newEmail,
  });

  const welcomeText = `Hello ${username},\n\nYour email has been successfully updated to ${newEmail}.\n\nYou will now receive all notifications at this address.`;

  await sendEmail(newEmail, "Email Address Updated", welcomeHtml, welcomeText);
}

export { createUser, logUserIntoApp, getUserProfile };
