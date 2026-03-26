import mongoose from "mongoose";

// Credentials/Certifications Schema
const credentialSchema = new mongoose.Schema(
  {
    credentialName: {
      type: String,
      required: true, // e.g., MD, RN, BPharm, MRCP
    },
    issueDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
    },
    certificateNumber: {
      type: String,
    },
    issuer: {
      type: String, // e.g., Medical Board, University
    },
  },
  { _id: false }
);

// Staff Model - Main staff profile
const staffSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/.+@.+\..+/, "Please provide a valid email"],
    },
    phone: {
      type: String,
      required: true,
      match: [/^[0-9\-\+]{10,}$/, "Please provide a valid phone number"],
    },
    department: {
      type: String,
      enum: [
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
        "reception",
      ],
      required: true,
    },
    position: {
      type: String,
      enum: [
        "doctor",
        "nurse",
        "technician",
        "staff",
        "admin",
        "receptionist",
        "pharmacist",
        "surgeon",
      ],
      required: true,
    },
    specializations: [
      {
        type: String, // e.g., Cardiology, Neurosurgery, Pediatric Nursing
      },
    ],
    credentials: [credentialSchema],
    qualifications: [
      {
        degreeType: String, // Bachelor, Master, Diploma
        institution: String,
        field: String,
        year: Number,
      },
    ],
    joiningDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    licenseNumber: {
      type: String,
    },
    licenseExpiry: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "on_leave", "suspended"],
      default: "active",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Indexes for performance
staffSchema.index({ email: 1 });
staffSchema.index({ department: 1, position: 1 });
staffSchema.index({ status: 1 });
staffSchema.index({ createdAt: -1 });

// Schedule Model - Staff shift schedule
const scheduleSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    shiftType: {
      type: String,
      enum: ["morning", "afternoon", "evening", "night", "flexible"],
      required: true,
    },
    startTime: {
      type: String, // HH:MM format
      required: true,
    },
    endTime: {
      type: String, // HH:MM format
      required: true,
    },
    daysOfWeek: [
      {
        type: String,
        enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
      },
    ],
    isOnCall: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Indexes
scheduleSchema.index({ staffId: 1, status: 1 });
scheduleSchema.index({ startDate: 1, endDate: 1 });

// Attendance Model - Daily attendance tracking
const attendanceSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkInTime: {
      type: Date,
    },
    checkOutTime: {
      type: Date,
    },
    hoursWorked: {
      type: Number, // Calculated in minutes
      default: 0,
    },
    status: {
      type: String,
      enum: ["present", "absent", "on_leave", "half_day", "late"],
      default: "present",
    },
    notes: String,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes
attendanceSchema.index({ staffId: 1, date: -1 });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ status: 1 });

// Leave Model - Leave requests and approvals
const leaveSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    leaveType: {
      type: String,
      enum: ["sick", "casual", "annual", "maternity", "paternity", "unpaid"],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    numberOfDays: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvalDate: Date,
    rejectionReason: String,
    comments: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes
leaveSchema.index({ staffId: 1, status: 1 });
leaveSchema.index({ startDate: 1, endDate: 1 });
leaveSchema.index({ status: 1 });

// Performance Model - Monthly performance metrics
const performanceSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    appointmentsHandled: {
      type: Number,
      default: 0,
    },
    appointmentsCompleted: {
      type: Number,
      default: 0,
    },
    patientRatings: [
      {
        patientId: mongoose.Schema.Types.ObjectId,
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        comment: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    completionRate: {
      type: Number, // Percentage
      default: 0,
    },
    tasksAssigned: {
      type: Number,
      default: 0,
    },
    tasksCompleted: {
      type: Number,
      default: 0,
    },
    feedback: String,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewDate: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes
performanceSchema.index({ staffId: 1, year: 1, month: 1 });
performanceSchema.index({ averageRating: -1 });
performanceSchema.index({ completionRate: -1 });

// Export models
export const StaffModel = mongoose.model("Staff", staffSchema);
export const ScheduleModel = mongoose.model("Schedule", scheduleSchema);
export const AttendanceModel = mongoose.model("Attendance", attendanceSchema);
export const LeaveModel = mongoose.model("Leave", leaveSchema);
export const PerformanceModel = mongoose.model("Performance", performanceSchema);
