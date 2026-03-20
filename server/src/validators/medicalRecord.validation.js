import Joi from "joi";

export const validateCreateMedicalRecord = Joi.object({
  patientId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid patient ID format",
      "string.empty": "Patient ID is required"
    }),
  appointmentId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      "string.pattern.base": "Invalid appointment ID format"
    }),
  visitReason: Joi.string()
    .max(500)
    .required()
    .messages({
      "string.empty": "Visit reason is required",
      "string.max": "Visit reason cannot exceed 500 characters"
    }),
  symptoms: Joi.string()
    .max(1000)
    .required()
    .messages({
      "string.empty": "Symptoms are required",
      "string.max": "Symptoms cannot exceed 1000 characters"
    }),
  vitals: Joi.object({
    bloodPressure: Joi.string().optional(),
    temperature: Joi.string().optional(),
    heartRate: Joi.string().optional(),
    respiratoryRate: Joi.string().optional(),
    weight: Joi.string().optional(),
    height: Joi.string().optional()
  }).optional(),
  notes: Joi.string().max(2000).optional()
});

export const validateAddDiagnosis = Joi.object({
  title: Joi.string()
    .max(200)
    .required()
    .messages({
      "string.empty": "Diagnosis title is required",
      "string.max": "Title cannot exceed 200 characters"
    }),
  description: Joi.string()
    .max(1000)
    .required()
    .messages({
      "string.empty": "Diagnosis description is required",
      "string.max": "Description cannot exceed 1000 characters"
    }),
  additionalNotes: Joi.string().max(500).optional()
});

export const validateAddPrescription = Joi.object({
  medicineName: Joi.string()
    .max(200)
    .required()
    .messages({
      "string.empty": "Medicine name is required",
      "string.max": "Medicine name cannot exceed 200 characters"
    }),
  dosage: Joi.string()
    .max(100)
    .required()
    .messages({
      "string.empty": "Dosage is required",
      "string.max": "Dosage cannot exceed 100 characters"
    }),
  frequency: Joi.string()
    .valid("Once daily", "Twice daily", "Three times daily", "Four times daily", "As needed")
    .required()
    .messages({
      "any.only": "Frequency must be one of: Once daily, Twice daily, Three times daily, Four times daily, As needed",
      "string.empty": "Frequency is required"
    }),
  duration: Joi.string()
    .max(100)
    .required()
    .messages({
      "string.empty": "Duration is required",
      "string.max": "Duration cannot exceed 100 characters"
    }),
  instructions: Joi.string().max(500).optional()
});

export const validateUpdateMedicalRecord = Joi.object({
  visitReason: Joi.string().max(500).optional(),
  symptoms: Joi.string().max(1000).optional(),
  vitals: Joi.object({
    bloodPressure: Joi.string().optional(),
    temperature: Joi.string().optional(),
    heartRate: Joi.string().optional(),
    respiratoryRate: Joi.string().optional(),
    weight: Joi.string().optional(),
    height: Joi.string().optional()
  }).optional(),
  notes: Joi.string().max(2000).optional(),
  followUpRequired: Joi.boolean().optional(),
  followUpDate: Joi.date().optional(),
  status: Joi.string()
    .valid("completed", "pending", "archived")
    .optional()
    .messages({
      "any.only": "Status must be one of: completed, pending, archived"
    })
}).min(1);

export const validateMedicalRecordQuery = Joi.object({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional(),
  patientId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  status: Joi.string()
    .valid("completed", "pending", "archived")
    .optional(),
  sortBy: Joi.string()
    .valid("createdAt", "updatedAt", "followUpDate")
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
      "string.pattern.base": "Invalid medical record ID format",
      "string.empty": "Medical record ID is required"
    })
});
