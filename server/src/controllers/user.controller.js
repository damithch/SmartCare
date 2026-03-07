import asyncHandler from "../utils/asyncHandler.js";
import {
  createUserByAdmin,
  deleteUserByAdmin,
  getAllUsers,
  getUserById,
  updateMyProfile,
  updateUserByAdmin
} from "../services/user.service.js";

export const listUsers = asyncHandler(async (req, res) => {
  const result = await getAllUsers({
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

export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user._id);

  res.status(200).json({
    success: true,
    data: user
  });
});

export const updateOwnProfile = asyncHandler(async (req, res) => {
  const updatedUser = await updateMyProfile(req.user._id, req.user.role, {
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password
  });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: updatedUser
  });
});

export const createUserAdmin = asyncHandler(async (req, res) => {
  const { fullName, email, password, role } = req.body;

  if (!fullName || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "fullName, email, password, and role are required"
    });
  }

  const user = await createUserByAdmin({ fullName, email, password, role });

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: user
  });
});

export const getUserAdminById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await getUserById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

export const updateUserAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fullName, email, password, role } = req.body;

  if (
    fullName === undefined &&
    email === undefined &&
    password === undefined &&
    role === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: "Provide at least one field to update"
    });
  }

  const user = await updateUserByAdmin(id, { fullName, email, password, role });

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: user
  });
});

export const deleteUserAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (req.user._id.toString() === id) {
    return res.status(400).json({
      success: false,
      message: "Admin cannot deactivate own account"
    });
  }

  const user = await deleteUserByAdmin(id);

  res.status(200).json({
    success: true,
    message: "User deactivated successfully",
    data: user
  });
});
