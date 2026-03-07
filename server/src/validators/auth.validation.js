import { ROLES } from "../constants/roles.js";
import { isValidEmail, isValidPassword } from "./common.js";

export const validateRegister = (payload) => {
  const value = {
    fullName: typeof payload.fullName === "string" ? payload.fullName.trim() : payload.fullName,
    email: typeof payload.email === "string" ? payload.email.trim().toLowerCase() : payload.email,
    password: payload.password,
    role: payload.role || ROLES.PATIENT
  };

  const errors = [];

  if (!value.fullName || value.fullName.length < 2) {
    errors.push({ field: "fullName", message: "fullName must be at least 2 characters" });
  }

  if (!value.email || !isValidEmail(value.email)) {
    errors.push({ field: "email", message: "email must be a valid email address" });
  }

  if (!value.password || !isValidPassword(value.password)) {
    errors.push({
      field: "password",
      message: "password must be at least 6 chars and include letters and numbers"
    });
  }

  if (!Object.values(ROLES).includes(value.role)) {
    errors.push({ field: "role", message: "role is invalid" });
  }

  return { value, errors };
};

export const validateLogin = (payload) => {
  const value = {
    email: typeof payload.email === "string" ? payload.email.trim().toLowerCase() : payload.email,
    password: payload.password
  };

  const errors = [];

  if (!value.email || !isValidEmail(value.email)) {
    errors.push({ field: "email", message: "email must be a valid email address" });
  }

  if (!value.password) {
    errors.push({ field: "password", message: "password is required" });
  }

  return { value, errors };
};
