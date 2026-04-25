import Joi from "joi";
import { createProviderAwareIdSchema } from "./uuid.validation.js";

export const validateCreateAppointment = Joi.object({
  patientId: createProviderAwareIdSchema("Invalid patient ID format", "Patient ID is required"),
  doctorId: createProviderAwareIdSchema("Invalid doctor ID format", "Doctor ID is required"),
  appointmentDate: Joi.date()
    .iso()
    .min("now")
    .optional()
    .messages({
      "date.base": "Invalid date format",
      "date.min": "Appointment date cannot be in the past"
    }),
  availabilityId: createProviderAwareIdSchema(
    "Invalid availability slot ID format",
    "Availability slot ID is required",
    { required: false }
  )
}).or("appointmentDate", "availabilityId");

export const validateAppointmentCheckout = Joi.object({
  patientId: createProviderAwareIdSchema("Invalid patient ID format", "Patient ID is required"),
  doctorId: createProviderAwareIdSchema("Invalid doctor ID format", "Doctor ID is required"),
  availabilityId: createProviderAwareIdSchema("Invalid availability slot ID format", "Availability slot ID is required")
});

export const validateConfirmAppointmentPayment = Joi.object({
  patientId: createProviderAwareIdSchema("Invalid patient ID format", "Patient ID is required"),
  doctorId: createProviderAwareIdSchema("Invalid doctor ID format", "Doctor ID is required"),
  availabilityId: createProviderAwareIdSchema("Invalid availability slot ID format", "Availability slot ID is required"),
  paymentIntentId: Joi.string().required().messages({
    "string.empty": "Payment intent ID is required"
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
    .valid("pending", "approved", "rejected", "completed", "cancelled")
    .optional()
    .messages({
      "any.only": "Status must be one of: pending, approved, rejected, completed, cancelled"
    })
}).min(1);

export const validateAppointmentStatus = Joi.object({
  status: Joi.string()
    .valid("pending", "approved", "rejected", "completed", "cancelled")
    .required()
    .messages({
      "any.only": "Status must be one of: pending, approved, rejected, completed, cancelled",
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
    .valid("pending", "approved", "rejected", "completed", "cancelled")
    .optional(),
  doctorId: createProviderAwareIdSchema("Invalid doctor ID format", "Doctor ID is required", { required: false }),
  patientId: createProviderAwareIdSchema("Invalid patient ID format", "Patient ID is required", { required: false }),
  sortBy: Joi.string()
    .valid("appointmentDate", "createdAt", "updatedAt")
    .optional(),
  sortOrder: Joi.string()
    .valid("asc", "desc")
    .optional()
});

export const validateMongoIdParam = Joi.object({
  id: createProviderAwareIdSchema("Invalid appointment ID format", "Appointment ID is required")
});
