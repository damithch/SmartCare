import { createUser, findUserByEmail } from "./user.service.js";
import { generateToken } from "../utils/jwt.js";
import AppError from "../utils/appError.js";

export const registerService = async ({ fullName, email, password, role }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new AppError("Email is already registered", 409, "DUPLICATE_EMAIL");
  }

  const user = await createUser({ fullName, email: normalizedEmail, password, role });

  const token = generateToken({ id: user._id, role: user.role });

  return { token, user };
};

export const loginService = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  if (!user.isActive) {
    throw new AppError("Account is deactivated", 403, "ACCOUNT_DEACTIVATED");
  }

  const isMatched = await user.comparePassword(password);

  if (!isMatched) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }

  const token = generateToken({ id: user._id, role: user.role });

  return { token, user };
};
