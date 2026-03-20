import Joi from "joi";
import { ROLES } from "../constants/roles.js";

export const validateRegister = Joi.object({
  fullName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.empty": "Full name is required",
      "string.min": "Full name must be at least 2 characters",
      "string.max": "Full name must not exceed 100 characters"
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
    .optional()
    .default(ROLES.PATIENT)
    .messages({
      "any.only": `Role must be one of: ${Object.values(ROLES).join(", ")}`
    })
});

export const validateLogin = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      "string.email": "Please provide a valid email",
      "string.empty": "Email is required"
    }),
  password: Joi.string()
    .required()
    .messages({
      "string.empty": "Password is required"
    })
});
