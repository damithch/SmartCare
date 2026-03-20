import Joi from "joi";
import { ROLES } from "../constants/roles.js";

export const validateCreateAppointment = Joi.object({
  patientId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid patient ID format",
      "string.empty": "Patient ID is required"
    }),
  doctorId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid doctor ID format",
      "string.empty": "Doctor ID is required"
    }),
  appointmentDate: Joi.date()
    .iso()
    .min("now")
    .required()
    .messages({
      "date.base": "Invalid date format",
      "date.min": "Appointment date cannot be in the past",
      "any.required": "Appointment date is required"
    })
});

export const validateUpdateAppointment = Joi.object({
  appointmentDate: Joi.date()
    .iso()
    .min("now")
    .optional()
    .messages({
      "date.base": "Invalid date format",
      "date.min": "Appointment date cannot be in the past"
    }),
  status: Joi.string()
    .valid("scheduled", "completed", "cancelled")
    .optional()
    .messages({
      "any.only": "Status must be one of: scheduled, completed, cancelled"
    })
}).min(1);

export const validateAppointmentStatus = Joi.object({
  status: Joi.string()
    .valid("scheduled", "completed", "cancelled")
    .required()
    .messages({
      "any.only": "Status must be one of: scheduled, completed, cancelled",
      "string.empty": "Status is required"
    })
});

export const validateAppointmentQuery = Joi.object({
  page: Joi.number()
    .min(1)
    .optional(),
  limit: Joi.number()
    .min(1)
    .max(100)
    .optional(),
  status: Joi.string()
    .valid("scheduled", "completed", "cancelled")
    .optional(),
  doctorId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  patientId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional(),
  sortBy: Joi.string()
    .valid("appointmentDate", "createdAt", "updatedAt")
    .optional(),
  sortOrder: Joi.string()
    .valid("asc", "desc")
    .optional()
});

export const validateMongoIdParam = Joi.object({
  id: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid appointment ID format",
      "string.empty": "Appointment ID is required"
    })
});
