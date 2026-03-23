import "dotenv/config";
import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET || "change_this_secret";
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";

export const generateToken = (payload) =>
  jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
