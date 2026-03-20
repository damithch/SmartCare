import Joi from "joi";

// Add lab test catalog schema
export const addLabTestSchema = Joi.object().keys({
  testName: Joi.string().required().messages({
    "any.required": "Test name is required",
  }),
  category: Joi.string()
    .valid("pathology", "radiology", "cardiology", "ultrasound", "blood_test", "urine_test", "genetics", "imaging", "other")
    .required(),
  description: Joi.string().allow(""),
  techniqueName: Joi.string().allow(""),
  specimenType: Joi.string().allow(""),
  Normal_range: Joi.string().allow(""),
  price: Joi.number().min(0).required(),
  setupTime: Joi.number().min(1).default(30),
  resultTurnaroundTime: Joi.number().min(1).default(24),
  requiresPrep: Joi.boolean().default(false),
  prepInstructions: Joi.string().allow(""),
});

// Update lab test schema
export const updateLabTestSchema = Joi.object().keys({
  category: Joi.string().valid("pathology", "radiology", "cardiology", "ultrasound", "blood_test", "urine_test", "genetics", "imaging", "other"),
  description: Joi.string().allow(""),
  price: Joi.number().min(0),
  setupTime: Joi.number().min(1),
  resultTurnaroundTime: Joi.number().min(1),
  requiresPrep: Joi.boolean(),
  prepInstructions: Joi.string().allow(""),
  isAvailable: Joi.boolean(),
});

// Create lab test request schema
export const createLabTestRequestSchema = Joi.object().keys({
  patient: Joi.string().required().messages({
    "any.required": "Patient ID is required",
  }),
  doctor: Joi.string().required().messages({
    "any.required": "Doctor ID is required",
  }),
  appointment: Joi.string().allow(null),
  tests: Joi.array()
    .items(
      Joi.object({
        test: Joi.string().required(),
        quantity: Joi.number().min(1).default(1),
        priority: Joi.string().valid("routine", "urgent", "stat").default("routine"),
        notes: Joi.string().allow(""),
      })
    )
    .required()
    .min(1),
  clinicalNotes: Joi.string().allow(""),
  referralNumber: Joi.string().allow(""),
});

// Update test request status schema
export const updateTestRequestStatusSchema = Joi.object().keys({
  status: Joi.string()
    .valid("requested", "scheduled", "in-progress", "completed", "cancelled")
    .required(),
  scheduledDate: Joi.date().allow(null),
  cancellationReason: Joi.string().when("status", {
    is: "cancelled",
    then: Joi.required(),
    otherwise: Joi.allow(""),
  }),
});

// Create lab result schema
export const createLabResultSchema = Joi.object().keys({
  testRequest: Joi.string().required().messages({
    "any.required": "Test request ID is required",
  }),
  test: Joi.string().required().messages({
    "any.required": "Test ID is required",
  }),
  resultValue: Joi.string().allow("").required(),
  unit: Joi.string().allow(""),
  referenceRange: Joi.string().allow(""),
  abnormalFlag: Joi.boolean().default(false),
  technicianNotes: Joi.string().allow(""),
  technician: Joi.string().allow(null),
});

// Update lab result schema
export const updateLabResultSchema = Joi.object().keys({
  resultValue: Joi.string(),
  unit: Joi.string().allow(""),
  referenceRange: Joi.string().allow(""),
  abnormalFlag: Joi.boolean(),
  status: Joi.string().valid("pending", "processing", "completed", "abnormal", "reviewed"),
  technicianNotes: Joi.string().allow(""),
  interpretation: Joi.string().allow(""),
  qualityCheck: Joi.boolean(),
});

// Approve result schema
export const approveResultSchema = Joi.object().keys({
  approved: Joi.boolean().required(),
  interpretation: Joi.string().when("approved", {
    is: true,
    then: Joi.required(),
    otherwise: Joi.allow(""),
  }),
  rejectionReason: Joi.string().when("approved", {
    is: false,
    then: Joi.required(),
    otherwise: Joi.allow(""),
  }),
});

// Filter schema for lab tests
export const labTestFilterSchema = Joi.object().keys({
  category: Joi.string()
    .valid("pathology", "radiology", "cardiology", "ultrasound", "blood_test", "urine_test", "genetics", "imaging", "other")
    .allow(""),
  search: Joi.string().allow(""),
  isAvailable: Joi.string().valid("true", "false").allow(""),
  minPrice: Joi.number().min(0).allow(null),
  maxPrice: Joi.number().min(0).allow(null),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid("testName", "price", "createdAt").default("testName"),
  sortOrder: Joi.string().valid("asc", "desc").default("asc"),
});

// Filter schema for test requests
export const testRequestFilterSchema = Joi.object().keys({
  patient: Joi.string().allow(""),
  doctor: Joi.string().allow(""),
  status: Joi.string()
    .valid("requested", "scheduled", "in-progress", "completed", "cancelled")
    .allow(""),
  priority: Joi.string().valid("routine", "urgent", "stat").allow(""),
  startDate: Joi.date().allow(null),
  endDate: Joi.date().allow(null),
  search: Joi.string().allow(""),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid("createdAt", "scheduledDate", "status").default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

// Filter schema for lab results
export const labResultFilterSchema = Joi.object().keys({
  patient: Joi.string().allow(""),
  testRequest: Joi.string().allow(""),
  status: Joi.string()
    .valid("pending", "processing", "completed", "abnormal", "reviewed")
    .allow(""),
  abnormalFlag: Joi.string().valid("true", "false").allow(""),
  startDate: Joi.date().allow(null),
  endDate: Joi.date().allow(null),
  search: Joi.string().allow(""),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid("createdAt", "completedAt", "status").default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

// Upload attachment schema
export const uploadAttachmentSchema = Joi.object().keys({
  fileName: Joi.string().required(),
  filePath: Joi.string().required(),
  fileType: Joi.string().valid("PDF", "JPG", "PNG", "DICOM", "other").required(),
});
