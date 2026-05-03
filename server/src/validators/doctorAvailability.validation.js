import Joi from "joi";

export const validateAvailabilityQuery = Joi.object({
  date: Joi.string().allow("").pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
    "string.pattern.base": "Date must be in YYYY-MM-DD format"
  })
});

export const validateDoctorAvailabilityLookup = Joi.object({
  doctorId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid doctor ID format",
    "string.empty": "Doctor ID is required"
  }),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    "string.pattern.base": "Date must be in YYYY-MM-DD format",
    "string.empty": "Date is required"
  })
});

export const validateCreateAvailability = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    "string.pattern.base": "Date must be in YYYY-MM-DD format",
    "string.empty": "Date is required"
  }),
  startTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required().messages({
    "string.pattern.base": "Start time must be in HH:MM format",
    "string.empty": "Start time is required"
  }),
  endTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required().messages({
    "string.pattern.base": "End time must be in HH:MM format",
    "string.empty": "End time is required"
  }),
  price: Joi.number().min(0).precision(2).required().messages({
    "number.base": "Price must be a number",
    "number.min": "Price cannot be negative",
    "any.required": "Price is required"
  }),
  maxPatients: Joi.number().integer().min(1).required().messages({
    "number.base": "Person count must be a number",
    "number.integer": "Person count must be a whole number",
    "number.min": "Person count must be at least 1",
    "any.required": "Person count is required"
  })
});

export const validateAvailabilityIdParam = Joi.object({
  id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    "string.pattern.base": "Invalid availability slot ID format",
    "string.empty": "Availability slot ID is required"
  })
});
