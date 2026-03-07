import User from "../models/user.model.js";
import { ROLES } from "../constants/roles.js";

const SELF_PROFILE_FIELD_ALLOWLIST = {
  [ROLES.PATIENT]: ["fullName", "email", "password"],
  [ROLES.DOCTOR]: ["fullName", "email", "password"],
  [ROLES.NURSE]: ["fullName", "password"],
  [ROLES.STAFF]: ["fullName", "password"]
};

export const findUserByEmail = (email) => User.findOne({ email }).select("+password");

export const createUser = (payload) => User.create(payload);

export const getAllUsers = async ({
  page = 1,
  limit = 10,
  search = "",
  role,
  isActive,
  sortBy = "createdAt",
  sortOrder = "desc"
} = {}) => {
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), 100);
  const safeSortOrder = sortOrder === "asc" ? 1 : -1;
  const allowedSortFields = ["createdAt", "updatedAt", "fullName", "email", "role"];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

  const query = {};

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  if (role) query.role = role;
  if (isActive === "true") query.isActive = true;
  if (isActive === "false") query.isActive = false;

  const skip = (safePage - 1) * safeLimit;

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-password")
      .sort({ [safeSortBy]: safeSortOrder })
      .skip(skip)
      .limit(safeLimit),
    User.countDocuments(query)
  ]);

  return {
    users,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1
    }
  };
};

export const getUserById = (id) => User.findById(id).select("-password");

export const updateMyProfile = async (userId, role, payload) => {
  const allowedFields = SELF_PROFILE_FIELD_ALLOWLIST[role];

  if (!allowedFields) {
    const error = new Error("Your role is not allowed to update profile here");
    error.statusCode = 403;
    throw error;
  }

  const providedKeys = Object.keys(payload).filter((key) => payload[key] !== undefined);
  const disallowedKeys = providedKeys.filter((key) => !allowedFields.includes(key));

  if (disallowedKeys.length > 0) {
    const error = new Error(`Not allowed fields: ${disallowedKeys.join(", ")}`);
    error.statusCode = 403;
    throw error;
  }

  if (providedKeys.length === 0) {
    const error = new Error("Provide at least one field to update");
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId).select("+password");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (payload.email && payload.email !== user.email) {
    const duplicateEmail = await User.findOne({ email: payload.email });
    if (duplicateEmail) {
      const error = new Error("Email is already registered");
      error.statusCode = 409;
      throw error;
    }
  }

  for (const key of providedKeys) {
    user[key] = payload[key];
  }

  await user.save();
  return User.findById(user._id).select("-password");
};

export const createUserByAdmin = async ({ fullName, email, password, role }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({ fullName, email, password, role });
  return User.findById(user._id).select("-password");
};

export const updateUserByAdmin = async (id, payload) => {
  const user = await User.findById(id).select("+password");

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (payload.email && payload.email !== user.email) {
    const duplicateEmail = await User.findOne({ email: payload.email });
    if (duplicateEmail) {
      const error = new Error("Email is already registered");
      error.statusCode = 409;
      throw error;
    }
  }

  if (payload.fullName !== undefined) user.fullName = payload.fullName;
  if (payload.email !== undefined) user.email = payload.email;
  if (payload.role !== undefined) user.role = payload.role;
  if (payload.password !== undefined) user.password = payload.password;

  await user.save();
  return User.findById(user._id).select("-password");
};

export const deleteUserByAdmin = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  user.isActive = false;
  await user.save();

  return User.findById(user._id).select("-password");
};
