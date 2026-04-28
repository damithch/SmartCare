import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import * as userService from "../services/user.service.js";

export const listUsers = asyncHandler(async (req, res) => {
  const result = await userService.getAllUsers({
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    role: req.query.role,
    isActive: req.query.isActive,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder
  });

  res.status(200).json({
    success: true,
    data: result.users,
    pagination: result.pagination
  });
});

export const listDoctors = asyncHandler(async (req, res) => {
  const doctors = await userService.getDoctorDirectory({
    search: req.query.search
  });

  res.status(200).json({
    success: true,
    data: doctors
  });
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user._id);

  res.status(200).json({
    success: true,
    data: user
  });
});

export const updateOwnProfile = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateMyProfile(req.user._id, req.user.role, {
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone,
    studentId: req.body.studentId,
    department: req.body.department,
    level: req.body.level,
    bio: req.body.bio,
    specialization: req.body.specialization,
    consultationFee: req.body.consultationFee,
    avatar: req.body.avatar,
    coverImage: req.body.coverImage
  });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: updatedUser
  });
});

export const createUserAdmin = asyncHandler(async (req, res) => {
  const { fullName, email, password, role } = req.body;

  const user = await userService.createUserByAdmin({ fullName, email, password, role });

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: user
  });
});

export const getUserAdminById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await userService.getUserById(id);

  if (!user) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

export const updateUserAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName, email, password, role, isActive } = req.body;

  const user = await userService.updateUserByAdmin(id, { fullName, email, password, role, isActive });

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: user
  });
});

export const deleteUserAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (req.user._id.toString() === id) {
    throw new AppError("Admin cannot deactivate own account", 400, "SELF_DEACTIVATE_BLOCKED");
  }

  const user = await userService.deleteUserByAdmin(id);

  res.status(200).json({
    success: true,
    message: "User deactivated successfully",
    data: user
  });
});
