import asyncHandler from "../utils/asyncHandler.js";
import * as authService from "../services/auth.service.js";

export const register = asyncHandler(async (req, res) => {
  const { fullName, email, password, role } = req.body;
  const result = await authService.registerService({ fullName, email, password, role });

  res.status(201).json({
    success: true,
    message: "Registered successfully",
    data: {
      token: result.token,
      user: {
        id: result.user._id,
        fullName: result.user.fullName,
        email: result.user.email,
        role: result.user.role
      }
    }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginService({ email, password });

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    data: {
      token: result.token,
      user: {
        id: result.user._id,
        fullName: result.user.fullName,
        email: result.user.email,
        role: result.user.role
      }
    }
  });
});
