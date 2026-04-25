import "dotenv/config";
import jwt from "jsonwebtoken";
import { getUserById } from "../services/user.service.js";
import AppError from "../utils/appError.js";

const jwtSecret = process.env.JWT_SECRET || "change_this_secret";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await getUserById(decoded.id);

    if (!user) {
      return next(new AppError("Invalid token user", 401, "UNAUTHORIZED"));
    }
    if (!user.isActive) {
      return next(new AppError("Account is deactivated", 403, "ACCOUNT_DEACTIVATED"));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401, "UNAUTHORIZED"));
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError("Forbidden", 403, "FORBIDDEN"));
  }

  next();
};
