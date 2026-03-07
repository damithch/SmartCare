import asyncHandler from "../utils/asyncHandler.js";
import {
  createUserByAdmin,
  deleteUserByAdmin,
  getAllUsers,
  getUserById,
  updateUserByAdmin
} from "../services/user.service.js";

export const listUsers = asyncHandler(async (req, res) => {
  const users = await getAllUsers();

  res.status(200).json({
    success: true,
    data: users
  });
});

export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user._id);

  res.status(200).json({
    success: true,
    data: user
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
  await deleteUserByAdmin(id);

  res.status(200).json({
    success: true,
    message: "User deleted successfully"
  });
});
