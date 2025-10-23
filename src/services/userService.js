import User from "../models/user.js";

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

export { createUser };
