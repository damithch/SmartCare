import User from "../models/user.model.js";

export const findUserByEmail = (email) => User.findOne({ email }).select("+password");

export const createUser = (payload) => User.create(payload);

export const getAllUsers = () => User.find().select("-password");

export const getUserById = (id) => User.findById(id).select("-password");

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

  await user.deleteOne();
};
