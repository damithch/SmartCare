import Joi from "joi";
import { ROLES } from "../constants/roles.js";

const optionalProfileFields = {
  phone: Joi.string().max(30).optional().allow(""),
  studentId: Joi.string().max(50).optional().allow(""),
  department: Joi.string().max(100).optional().allow(""),
  level: Joi.string().max(50).optional().allow(""),
  bio: Joi.string().max(500).optional().allow("")
};

export const validateCreateUser = Joi.object({
  fullName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.empty": "Full name is required",
      "string.min": "Full name must be at least 2 characters"
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Please provide a valid email",
      "string.empty": "Email is required"
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      "string.min": "Password must be at least 6 characters",
      "string.empty": "Password is required"
    }),
  role: Joi.string()
    .valid(...Object.values(ROLES))
    .required()
    .messages({
      "any.only": `Role must be one of: ${Object.values(ROLES).join(", ")}`,
      "string.empty": "Role is required"
    }),
  ...optionalProfileFields
});

export const validateSelfUpdateUser = Joi.object({
  fullName: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      "string.min": "Full name must be at least 2 characters"
    }),
  email: Joi.string()
    .email()
    .optional()
    .messages({
      "string.email": "Please provide a valid email"
    }),
  password: Joi.string()
    .min(6)
    .optional()
    .messages({
      "string.min": "Password must be at least 6 characters"
    }),
  ...optionalProfileFields
}).min(1);

export const validateAdminUpdateUser = Joi.object({
  fullName: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      "string.min": "Full name must be at least 2 characters"
    }),
  email: Joi.string()
    .email()
    .optional()
    .messages({
      "string.email": "Please provide a valid email"
    }),
  password: Joi.string()
    .min(6)
    .optional()
    .messages({
      "string.min": "Password must be at least 6 characters"
    }),
  role: Joi.string()
    .valid(...Object.values(ROLES))
    .optional()
    .messages({
      "any.only": `Role must be one of: ${Object.values(ROLES).join(", ")}`
    }),
  ...optionalProfileFields
}).min(1);

export const validateMongoIdParam = Joi.object({
  id: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid user ID format",
      "string.empty": "User ID is required"
    })
});

export const validateUserListQuery = Joi.object({
  page: Joi.number()
    .min(1)
    .optional()
    .messages({
      "number.min": "Page must be at least 1"
    }),
  limit: Joi.number()
    .min(1)
    .max(100)
    .optional()
    .messages({
      "number.min": "Limit must be at least 1",
      "number.max": "Limit cannot exceed 100"
    }),
  search: Joi.string()
    .max(100)
    .optional(),
  role: Joi.string()
    .valid(...Object.values(ROLES))
    .optional()
    .messages({
      "any.only": `Role must be one of: ${Object.values(ROLES).join(", ")}`
    }),
  isActive: Joi.string()
    .valid("true", "false")
    .optional()
    .messages({
      "any.only": "isActive must be 'true' or 'false'"
    }),
  sortBy: Joi.string()
    .valid("createdAt", "updatedAt", "fullName", "email", "role")
    .optional()
    .messages({
      "any.only": "sortBy must be one of: createdAt, updatedAt, fullName, email, role"
    }),
  sortOrder: Joi.string()
    .valid("asc", "desc")
    .optional()
    .messages({
      "any.only": "sortOrder must be 'asc' or 'desc'"
    })
});
