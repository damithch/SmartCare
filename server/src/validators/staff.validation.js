import Joi from "joi";

// Add Staff Validator
export const addStaffSchema = Joi.object({
  firstName: Joi.string().trim().required().messages({
    "string.empty": "First name is required",
  }),
  lastName: Joi.string().trim().required().messages({
    "string.empty": "Last name is required",
  }),
  email: Joi.string().email().lowercase().required().messages({
    "string.email": "Please provide a valid email",
  }),
  phone: Joi.string()
    .pattern(/^[0-9\-\+]{10,}$/)
    .required()
    .messages({
      "string.pattern.base": "Please provide a valid phone number",
    }),
  department: Joi.string()
    .valid(
      "cardiology",
      "neurology",
      "orthopedics",
      "pediatrics",
      "surgery",
      "emergency",
      "laboratory",
      "pharmacy",
      "nursing",
      "administration",
      "reception"
    )
    .required(),
  position: Joi.string()
    .valid(
      "doctor",
      "nurse",
      "technician",
      "staff",
      "admin",
      "receptionist",
      "pharmacist",
      "surgeon"
    )
    .required(),
  specializations: Joi.array().items(Joi.string()).optional(),
  qualifications: Joi.array()
    .items(
      Joi.object({
        degreeType: Joi.string().required(),
        institution: Joi.string().required(),
        field: Joi.string().required(),
        year: Joi.number().required(),
      })
    )
    .optional(),
  credentials: Joi.array()
    .items(
      Joi.object({
        credentialName: Joi.string().required(),
        issueDate: Joi.date().required(),
        expiryDate: Joi.date().optional(),
        certificateNumber: Joi.string().optional(),
        issuer: Joi.string().optional(),
      })
    )
    .optional(),
  joiningDate: Joi.date().required(),
  licenseNumber: Joi.string().optional(),
  licenseExpiry: Joi.date().optional(),
}).required();

// Update Staff Validator
export const updateStaffSchema = Joi.object({
  firstName: Joi.string().trim().optional(),
  lastName: Joi.string().trim().optional(),
  email: Joi.string().email().lowercase().optional(),
  phone: Joi.string()
    .pattern(/^[0-9\-\+]{10,}$/)
    .optional(),
  department: Joi.string()
    .valid(
      "cardiology",
      "neurology",
      "orthopedics",
      "pediatrics",
      "surgery",
      "emergency",
      "laboratory",
      "pharmacy",
      "nursing",
      "administration",
      "reception"
    )
    .optional(),
  position: Joi.string()
    .valid(
      "doctor",
      "nurse",
      "technician",
      "staff",
      "admin",
      "receptionist",
      "pharmacist",
      "surgeon"
    )
    .optional(),
  status: Joi.string()
    .valid("active", "inactive", "on_leave", "suspended")
    .optional(),
  specializations: Joi.array().items(Joi.string()).optional(),
  licenseNumber: Joi.string().optional(),
  licenseExpiry: Joi.date().optional(),
}).required();

// Add Schedule Validator
export const addScheduleSchema = Joi.object({
  staffId: Joi.string().required().messages({
    "string.empty": "Staff ID is required",
  }),
  shiftType: Joi.string()
    .valid("morning", "afternoon", "evening", "night", "flexible")
    .required(),
  startTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "Start time must be in HH:MM format",
    }),
  endTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "End time must be in HH:MM format",
    }),
  daysOfWeek: Joi.array()
    .items(
      Joi.string().valid(
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
      )
    )
    .required(),
  isOnCall: Joi.boolean().optional().default(false),
  startDate: Joi.date().required(),
  endDate: Joi.date().optional(),
}).required();

// Update Schedule Validator
export const updateScheduleSchema = Joi.object({
  shiftType: Joi.string()
    .valid("morning", "afternoon", "evening", "night", "flexible")
    .optional(),
  startTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  endTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  daysOfWeek: Joi.array()
    .items(
      Joi.string().valid(
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
      )
    )
    .optional(),
  isOnCall: Joi.boolean().optional(),
  endDate: Joi.date().optional(),
  status: Joi.string().valid("active", "inactive", "archived").optional(),
}).required();

// Check-in/Check-out Validator
export const attendanceCheckInSchema = Joi.object({
  staffId: Joi.string().required(),
  notes: Joi.string().optional().max(500),
}).required();

// Update Attendance Validator
export const updateAttendanceSchema = Joi.object({
  date: Joi.date().optional(),
  status: Joi.string()
    .valid("present", "absent", "on_leave", "half_day", "late")
    .optional(),
  notes: Joi.string().optional().max(500),
}).required();

// Request Leave Validator
export const requestLeaveSchema = Joi.object({
  staffId: Joi.string().required(),
  leaveType: Joi.string()
    .valid("sick", "casual", "annual", "maternity", "paternity", "unpaid")
    .required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required().min(Joi.ref("startDate")),
  numberOfDays: Joi.number().positive().required(),
  reason: Joi.string().required().min(10).max(500),
}).required();

// Approve Leave Validator
export const approveLeaveSchema = Joi.object({
  status: Joi.string().valid("approved", "rejected").required(),
  comments: Joi.string().optional().max(500),
  rejectionReason: Joi.string().when("status", {
    is: "rejected",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
}).required();

// Add Performance Review Validator
export const addPerformanceSchema = Joi.object({
  staffId: Joi.string().required(),
  year: Joi.number().required().min(2020),
  month: Joi.number().required().min(1).max(12),
  appointmentsHandled: Joi.number().optional().min(0),
  appointmentsCompleted: Joi.number().optional().min(0),
  tasksAssigned: Joi.number().optional().min(0),
  tasksCompleted: Joi.number().optional().min(0),
  feedback: Joi.string().optional().max(1000),
}).required();

// Update Performance Review Validator
export const updatePerformanceSchema = Joi.object({
  appointmentsHandled: Joi.number().optional().min(0),
  appointmentsCompleted: Joi.number().optional().min(0),
  tasksAssigned: Joi.number().optional().min(0),
  tasksCompleted: Joi.number().optional().min(0),
  feedback: Joi.string().optional().max(1000),
}).required();

// Add Patient Rating Validator
export const addPatientRatingSchema = Joi.object({
  patientId: Joi.string().required(),
  rating: Joi.number().required().min(1).max(5),
  comment: Joi.string().optional().max(500),
}).required();

// Filter Staff Validator
export const filterStaffSchema = Joi.object({
  department: Joi.string()
    .valid(
      "cardiology",
      "neurology",
      "orthopedics",
      "pediatrics",
      "surgery",
      "emergency",
      "laboratory",
      "pharmacy",
      "nursing",
      "administration",
      "reception"
    )
    .optional(),
  position: Joi.string()
    .valid(
      "doctor",
      "nurse",
      "technician",
      "staff",
      "admin",
      "receptionist",
      "pharmacist",
      "surgeon"
    )
    .optional(),
  status: Joi.string()
    .valid("active", "inactive", "on_leave", "suspended")
    .optional(),
  search: Joi.string().optional(),
  specialization: Joi.string().optional(),
  page: Joi.number().optional().default(1),
  limit: Joi.number().optional().default(10),
  sortBy: Joi.string()
    .valid("firstName", "department", "position", "createdAt", "averageRating")
    .optional()
    .default("createdAt"),
  sortOrder: Joi.string()
    .valid("asc", "desc")
    .optional()
    .default("desc"),
}).required();

// Filter Schedule Validator
export const filterScheduleSchema = Joi.object({
  staffId: Joi.string().optional(),
  shiftType: Joi.string()
    .valid("morning", "afternoon", "evening", "night", "flexible")
    .optional(),
  status: Joi.string().valid("active", "inactive", "archived").optional(),
  page: Joi.number().optional().default(1),
  limit: Joi.number().optional().default(10),
  sortBy: Joi.string()
    .valid("staffId", "shiftType", "startDate", "createdAt")
    .optional()
    .default("createdAt"),
  sortOrder: Joi.string()
    .valid("asc", "desc")
    .optional()
    .default("desc"),
}).required();

// Filter Attendance Validator
export const filterAttendanceSchema = Joi.object({
  staffId: Joi.string().optional(),
  status: Joi.string()
    .valid("present", "absent", "on_leave", "half_day", "late")
    .optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  page: Joi.number().optional().default(1),
  limit: Joi.number().optional().default(10),
  sortBy: Joi.string()
    .valid("date", "status", "hoursWorked", "createdAt")
    .optional()
    .default("date"),
  sortOrder: Joi.string()
    .valid("asc", "desc")
    .optional()
    .default("desc"),
}).required();

// Filter Leave Validator
export const filterLeaveSchema = Joi.object({
  staffId: Joi.string().optional(),
  leaveType: Joi.string()
    .valid("sick", "casual", "annual", "maternity", "paternity", "unpaid")
    .optional(),
  status: Joi.string()
    .valid("pending", "approved", "rejected", "cancelled")
    .optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  page: Joi.number().optional().default(1),
  limit: Joi.number().optional().default(10),
  sortBy: Joi.string()
    .valid("startDate", "leaveType", "status", "createdAt")
    .optional()
    .default("createdAt"),
  sortOrder: Joi.string()
    .valid("asc", "desc")
    .optional()
    .default("desc"),
}).required();

// Filter Performance Validator
export const filterPerformanceSchema = Joi.object({
  staffId: Joi.string().optional(),
  year: Joi.number().optional(),
  month: Joi.number().optional().min(1).max(12),
  minRating: Joi.number().optional().min(0).max(5),
  page: Joi.number().optional().default(1),
  limit: Joi.number().optional().default(10),
  sortBy: Joi.string()
    .valid("averageRating", "completionRate", "createdAt", "month")
    .optional()
    .default("createdAt"),
  sortOrder: Joi.string()
    .valid("asc", "desc")
    .optional()
    .default("desc"),
}).required();
