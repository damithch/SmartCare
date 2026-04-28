import User from "../models/user.model.js";
import { ROLES } from "../constants/roles.js";
import AppError from "../utils/appError.js";

const SELF_PROFILE_FIELD_ALLOWLIST = {
  [ROLES.PATIENT]: ["fullName", "email", "password", "phone", "avatar", "coverImage"],
  [ROLES.DOCTOR]: ["fullName", "email", "password", "phone", "bio", "specialization", "consultationFee", "avatar", "coverImage"],
  [ROLES.PHARMACIST]: ["fullName", "email", "password", "phone", "avatar", "coverImage"],
  [ROLES.STUDENT]: ["fullName", "email", "password", "phone", "studentId", "department", "level", "bio", "avatar", "coverImage"],
  [ROLES.ADMIN]: ["fullName", "email", "password", "phone", "avatar", "coverImage"],
  [ROLES.SYSTEM_ADMIN]: ["fullName", "email", "password", "phone", "avatar", "coverImage"],
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

export const getDoctorDirectory = async ({ search = "" } = {}) => {
  const query = {
    role: ROLES.DOCTOR,
    isActive: true
  };

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { specialization: { $regex: search, $options: "i" } }
    ];
  }

  return User.find(query)
    .select("fullName email phone specialization consultationFee bio avatar")
    .sort({ fullName: 1 });
};

export const updateMyProfile = async (userId, role, payload) => {
  const allowedFields = SELF_PROFILE_FIELD_ALLOWLIST[role];

  if (!allowedFields) {
    throw new AppError(
      "Your role is not allowed to update profile here",
      403,
      "FORBIDDEN_PROFILE_UPDATE"
    );
  }

  const providedKeys = Object.keys(payload).filter((key) => payload[key] !== undefined);
  const disallowedKeys = providedKeys.filter((key) => !allowedFields.includes(key));

  if (disallowedKeys.length > 0) {
    throw new AppError(
      `Not allowed fields: ${disallowedKeys.join(", ")}`,
      403,
      "FORBIDDEN_PROFILE_FIELDS"
    );
  }

  if (providedKeys.length === 0) {
    throw new AppError("Provide at least one field to update", 400, "VALIDATION_ERROR");
  }

  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  if (payload.email) {
    payload.email = payload.email.trim().toLowerCase();
  }

  if (payload.email && payload.email !== user.email) {
    const duplicateEmail = await User.findOne({ email: payload.email });
    if (duplicateEmail) {
      throw new AppError("Email is already registered", 409, "DUPLICATE_EMAIL");
    }
  }

  for (const key of providedKeys) {
    user[key] = payload[key];
  }

  await user.save();
  return User.findById(user._id).select("-password");
};

export const createUserByAdmin = async ({ fullName, email, password, role }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new AppError("Email is already registered", 409, "DUPLICATE_EMAIL");
  }

  const user = await User.create({ fullName, email: normalizedEmail, password, role });
  return User.findById(user._id).select("-password");
};

export const updateUserByAdmin = async (id, payload) => {
  const user = await User.findById(id).select("+password");

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  if (payload.email && payload.email !== user.email) {
    payload.email = payload.email.trim().toLowerCase();
    const duplicateEmail = await User.findOne({ email: payload.email });
    if (duplicateEmail) {
      throw new AppError("Email is already registered", 409, "DUPLICATE_EMAIL");
    }
  }

  if (payload.fullName !== undefined) user.fullName = payload.fullName;
  if (payload.email !== undefined) user.email = payload.email;
  if (payload.role !== undefined) user.role = payload.role;
  if (payload.password !== undefined) user.password = payload.password;
  if (payload.isActive !== undefined) user.isActive = payload.isActive;

  await user.save();
  return User.findById(user._id).select("-password");
};

export const deleteUserByAdmin = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  user.isActive = false;
  await user.save();

  return User.findById(user._id).select("-password");
};
