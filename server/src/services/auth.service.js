import { createUser, findUserByEmail } from "./user.service.js";
import { generateToken } from "../utils/jwt.js";

export const registerService = async ({ fullName, email, password, role }) => {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  const user = await createUser({ fullName, email, password, role });

  const token = generateToken({ id: user._id, role: user.role });

  return { token, user };
};

export const loginService = async ({ email, password }) => {
  const user = await findUserByEmail(email);

  if (!user) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("Account is deactivated");
    error.statusCode = 403;
    throw error;
  }

  const isMatched = await user.comparePassword(password);

  if (!isMatched) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken({ id: user._id, role: user.role });

  return { token, user };
};
