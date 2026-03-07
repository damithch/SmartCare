import mongoose from "mongoose";
import { ROLES } from "../constants/roles.js";
import { isValidEmail, isValidPassword, parsePositiveInt } from "./common.js";

const ALLOWED_SORT_FIELDS = ["createdAt", "updatedAt", "fullName", "email", "role"];
const ALLOWED_SORT_ORDER = ["asc", "desc"];

export const validateMongoIdParam = (payload) => {
  const value = { ...payload };
  const errors = [];

  if (!mongoose.Types.ObjectId.isValid(value.id)) {
    errors.push({ field: "id", message: "id must be a valid Mongo ObjectId" });
  }

  return { value, errors };
};

export const validateUserListQuery = (payload) => {
  const value = {
    page: parsePositiveInt(payload.page, 1),
    limit: parsePositiveInt(payload.limit, 10),
    search: payload.search,
    role: payload.role,
    isActive: payload.isActive,
    sortBy: payload.sortBy || "createdAt",
    sortOrder: payload.sortOrder || "desc"
  };

  const errors = [];

  if (value.page === null || value.page < 1) {
    errors.push({ field: "page", message: "page must be a positive integer" });
  }

  if (value.limit === null || value.limit < 1 || value.limit > 100) {
    errors.push({ field: "limit", message: "limit must be between 1 and 100" });
  }

  if (value.role !== undefined && !Object.values(ROLES).includes(value.role)) {
    errors.push({ field: "role", message: "role filter is invalid" });
  }

  if (value.isActive !== undefined && value.isActive !== "true" && value.isActive !== "false") {
    errors.push({ field: "isActive", message: "isActive must be true or false" });
  }

  if (!ALLOWED_SORT_FIELDS.includes(value.sortBy)) {
    errors.push({ field: "sortBy", message: `sortBy must be one of: ${ALLOWED_SORT_FIELDS.join(", ")}` });
  }

  if (!ALLOWED_SORT_ORDER.includes(value.sortOrder)) {
    errors.push({ field: "sortOrder", message: "sortOrder must be asc or desc" });
  }

  return { value, errors };
};

export const validateCreateUser = (payload) => {
  const value = {
    fullName: typeof payload.fullName === "string" ? payload.fullName.trim() : payload.fullName,
    email: typeof payload.email === "string" ? payload.email.trim().toLowerCase() : payload.email,
    password: payload.password,
    role: payload.role
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

  if (!value.role || !Object.values(ROLES).includes(value.role)) {
    errors.push({ field: "role", message: "role is invalid" });
  }

  return { value, errors };
};

export const validateAdminUpdateUser = (payload) => {
  const value = {
    fullName: payload.fullName,
    email: typeof payload.email === "string" ? payload.email.trim().toLowerCase() : payload.email,
    password: payload.password,
    role: payload.role
  };

  const errors = [];
  const provided = Object.keys(value).filter((k) => value[k] !== undefined);

  if (provided.length === 0) {
    errors.push({ field: "body", message: "Provide at least one field to update" });
  }

  if (value.fullName !== undefined && (typeof value.fullName !== "string" || value.fullName.trim().length < 2)) {
    errors.push({ field: "fullName", message: "fullName must be at least 2 characters" });
  }

  if (value.email !== undefined && !isValidEmail(value.email)) {
    errors.push({ field: "email", message: "email must be a valid email address" });
  }

  if (value.password !== undefined && !isValidPassword(value.password)) {
    errors.push({
      field: "password",
      message: "password must be at least 6 chars and include letters and numbers"
    });
  }

  if (value.role !== undefined && !Object.values(ROLES).includes(value.role)) {
    errors.push({ field: "role", message: "role is invalid" });
  }

  if (value.fullName !== undefined) value.fullName = value.fullName.trim();

  return { value, errors };
};

export const validateSelfUpdateUser = (payload) => {
  const value = {
    fullName: payload.fullName,
    email: typeof payload.email === "string" ? payload.email.trim().toLowerCase() : payload.email,
    password: payload.password
  };

  const errors = [];
  const provided = Object.keys(value).filter((k) => value[k] !== undefined);

  if (provided.length === 0) {
    errors.push({ field: "body", message: "Provide at least one field to update" });
  }

  if (value.fullName !== undefined && (typeof value.fullName !== "string" || value.fullName.trim().length < 2)) {
    errors.push({ field: "fullName", message: "fullName must be at least 2 characters" });
  }

  if (value.email !== undefined && !isValidEmail(value.email)) {
    errors.push({ field: "email", message: "email must be a valid email address" });
  }

  if (value.password !== undefined && !isValidPassword(value.password)) {
    errors.push({
      field: "password",
      message: "password must be at least 6 chars and include letters and numbers"
    });
  }

  if (value.fullName !== undefined) value.fullName = value.fullName.trim();

  return { value, errors };
};
