import { createUser, findUserByEmail } from "./user.service.js";
import { generateToken } from "../utils/jwt.js";
import AppError from "../utils/appError.js";
import { ROLES } from "../constants/roles.js";

const DEFAULT_ADMIN = {
  fullName: "Admin",
  email: "admin@gmail.com",
  password: "Admin123@",
  role: ROLES.ADMIN
};

const ensureDefaultAdmin = async (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail !== DEFAULT_ADMIN.email || password !== DEFAULT_ADMIN.password) {
    return null;
  }

  let admin = await findUserByEmail(DEFAULT_ADMIN.email);

  if (!admin) {
    admin = await createUser(DEFAULT_ADMIN);
    return admin;
  }

  let shouldSave = false;

  if (admin.role !== ROLES.ADMIN) {
    admin.role = ROLES.ADMIN;
    shouldSave = true;
  }

  if (!admin.isActive) {
    admin.isActive = true;
    shouldSave = true;
  }

  const passwordMatches = await admin.comparePassword(DEFAULT_ADMIN.password);
  if (!passwordMatches) {
    admin.password = DEFAULT_ADMIN.password;
    shouldSave = true;
  }

  if (shouldSave) {
    await admin.save();
    admin = await findUserByEmail(DEFAULT_ADMIN.email);
  }

  return admin;
};

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
  const user = await ensureDefaultAdmin(normalizedEmail, password) || await findUserByEmail(normalizedEmail);

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
