import bcrypt from "bcryptjs";
import prisma from "../config/prisma.js";
import User from "../models/user.model.js";
import { ROLES } from "../constants/roles.js";
import AppError from "../utils/appError.js";

const SELF_PROFILE_FIELD_ALLOWLIST = {
  [ROLES.PATIENT]: ["fullName", "email", "password", "phone", "avatar", "coverImage"],
  [ROLES.DOCTOR]: ["fullName", "email", "password", "phone", "bio", "specialization", "consultationFee", "avatar", "coverImage"],
  [ROLES.PHARMACIST]: ["fullName", "email", "password", "phone", "avatar", "coverImage"],
  [ROLES.STUDENT]: ["fullName", "email", "password", "phone", "studentId", "department", "level", "bio", "avatar", "coverImage"],
  [ROLES.NURSE]: ["fullName", "password"],
  [ROLES.STAFF]: ["fullName", "password"]
};

const isPostgresProvider = () => process.env.DATABASE_PROVIDER === "postgres";

const toAppUser = (user) => {
  if (!user) return null;

  return {
    ...user,
    _id: user._id ?? user.id
  };
};

const toPublicAppUser = (user) => {
  if (!user) return null;

  const normalized = toAppUser(user);
  const { password, passwordHash, ...safeUser } = normalized;
  return safeUser;
};

const hashPassword = async (password) => bcrypt.hash(password, 10);

export const compareUserPassword = async (user, password) => {
  const hashedPassword = user?.password ?? user?.passwordHash;

  if (!hashedPassword) {
    return false;
  }

  return bcrypt.compare(password, hashedPassword);
};

export const findUserByEmail = async (email) => {
  if (isPostgresProvider()) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    return toAppUser(user);
  }

  const user = await User.findOne({ email }).select("+password");
  return toAppUser(user);
};

export const createUser = async (payload) => {
  if (isPostgresProvider()) {
    const user = await prisma.user.create({
      data: {
        fullName: payload.fullName,
        email: payload.email,
        passwordHash: await hashPassword(payload.password),
        role: payload.role ?? ROLES.PATIENT
      }
    });

    return toAppUser(user);
  }

  return User.create(payload);
};

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
  const skip = (safePage - 1) * safeLimit;

  if (isPostgresProvider()) {
    const where = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ];
    }

    if (role) where.role = role;
    if (isActive === "true") where.isActive = true;
    if (isActive === "false") where.isActive = false;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { [safeSortBy]: safeSortOrder === 1 ? "asc" : "desc" },
        skip,
        take: safeLimit
      }),
      prisma.user.count({ where })
    ]);

    return {
      users: users.map(toPublicAppUser),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1
      }
    };
  }

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

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-password")
      .sort({ [safeSortBy]: safeSortOrder })
      .skip(skip)
      .limit(safeLimit),
    User.countDocuments(query)
  ]);

  return {
    users: users.map(toPublicAppUser),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1
    }
  };
};

export const getUserById = async (id) => {
  if (isPostgresProvider()) {
    const user = await prisma.user.findUnique({ where: { id } });
    return toPublicAppUser(user);
  }

  const user = await User.findById(id).select("-password");
  return toPublicAppUser(user);
};

export const getDoctorDirectory = async ({ search = "" } = {}) => {
  if (isPostgresProvider()) {
    const where = {
      role: ROLES.DOCTOR,
      isActive: true
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { specialization: { contains: search, mode: "insensitive" } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        specialization: true,
        consultationFee: true,
        bio: true,
        avatar: true
      },
      orderBy: { fullName: "asc" }
    });

    return users.map(toPublicAppUser);
  }

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

  const users = await User.find(query)
    .select("fullName email phone specialization consultationFee bio avatar")
    .sort({ fullName: 1 });

  return users.map(toPublicAppUser);
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

  if (isPostgresProvider()) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    if (payload.email) {
      payload.email = payload.email.trim().toLowerCase();
    }

    if (payload.email && payload.email !== user.email) {
      const duplicateEmail = await prisma.user.findUnique({ where: { email: payload.email } });
      if (duplicateEmail) {
        throw new AppError("Email is already registered", 409, "DUPLICATE_EMAIL");
      }
    }

    const data = {};

    for (const key of providedKeys) {
      if (key === "password") {
        data.passwordHash = await hashPassword(payload.password);
      } else {
        data[key] = payload[key];
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data
    });

    return toPublicAppUser(updatedUser);
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
  const updatedUser = await User.findById(user._id).select("-password");
  return toPublicAppUser(updatedUser);
};

export const createUserByAdmin = async ({ fullName, email, password, role }) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (isPostgresProvider()) {
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existingUser) {
      throw new AppError("Email is already registered", 409, "DUPLICATE_EMAIL");
    }

    const user = await prisma.user.create({
      data: {
        fullName,
        email: normalizedEmail,
        passwordHash: await hashPassword(password),
        role
      }
    });

    return toPublicAppUser(user);
  }

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new AppError("Email is already registered", 409, "DUPLICATE_EMAIL");
  }

  const user = await User.create({ fullName, email: normalizedEmail, password, role });
  const createdUser = await User.findById(user._id).select("-password");
  return toPublicAppUser(createdUser);
};

export const updateUserByAdmin = async (id, payload) => {
  if (isPostgresProvider()) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    if (payload.email && payload.email !== user.email) {
      payload.email = payload.email.trim().toLowerCase();
      const duplicateEmail = await prisma.user.findUnique({ where: { email: payload.email } });
      if (duplicateEmail) {
        throw new AppError("Email is already registered", 409, "DUPLICATE_EMAIL");
      }
    }

    const data = {};

    if (payload.fullName !== undefined) data.fullName = payload.fullName;
    if (payload.email !== undefined) data.email = payload.email;
    if (payload.role !== undefined) data.role = payload.role;
    if (payload.password !== undefined) data.passwordHash = await hashPassword(payload.password);

    const updatedUser = await prisma.user.update({
      where: { id },
      data
    });

    return toPublicAppUser(updatedUser);
  }

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

  await user.save();
  const updatedUser = await User.findById(user._id).select("-password");
  return toPublicAppUser(updatedUser);
};

export const deleteUserByAdmin = async (id) => {
  if (isPostgresProvider()) {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new AppError("User not found", 404, "USER_NOT_FOUND");
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    return toPublicAppUser(updatedUser);
  }

  const user = await User.findById(id);

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  user.isActive = false;
  await user.save();

  const updatedUser = await User.findById(user._id).select("-password");
  return toPublicAppUser(updatedUser);
};
