import mongoose from "mongoose";

// Lab Test Catalog Schema
const labTestSchema = new mongoose.Schema(
  {
    testName: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["pathology", "radiology", "cardiology", "ultrasound", "blood_test", "urine_test", "genetics", "imaging", "other"],
      required: true,
      index: true,
    },
    description: String,
    techniqueName: String,
    specimenType: String, // Blood, Urine, Tissue, etc.
    Normal_range: String,
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    setupTime: {
      type: Number, // In minutes
      default: 30,
    },
    resultTurnaroundTime: {
      type: Number, // In hours
      default: 24,
    },
    requiresPrep: {
      type: Boolean,
      default: false,
    },
    prepInstructions: String,
    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { category: 1, isActive: 1 },
      { testName: 1, isActive: 1 },
    ],
  }
);

// Lab Test Request Schema
const labTestRequestSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    tests: [
      {
        test: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "LabTest",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        priority: {
          type: String,
          enum: ["routine", "urgent", "stat"],
          default: "routine",
        },
        notes: String,
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["requested", "scheduled", "in-progress", "completed", "cancelled"],
      default: "requested",
      index: true,
    },
    scheduledDate: Date,
    completionDate: Date,
    cancellationReason: String,
    clinicalNotes: String,
    referralNumber: String,
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { patient: 1, status: 1 },
      { doctor: 1, createdAt: -1 },
      { status: 1, createdAt: -1 },
    ],
  }
);

// Lab Result Schema
const resultAttachmentSchema = new mongoose.Schema({
  fileName: String,
  filePath: String,
  fileType: String, // PDF, JPG, PNG, etc.
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const labResultSchema = new mongoose.Schema(
  {
    testRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabTestRequest",
      required: true,
      index: true,
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LabTest",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resultValue: String, // Numeric or text result
    unit: String, // mg/dL, mm, etc.
    referenceRange: String,
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "abnormal", "reviewed"],
      default: "pending",
      index: true,
    },
    abnormalFlag: {
      type: Boolean,
      default: false,
    },
    interpretation: String, // Doctor's interpretation
    attachments: [resultAttachmentSchema],
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    technicianNotes: String,
    completedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    qualityCheck: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { testRequest: 1 },
      { patient: 1, status: 1 },
      { status: 1, completedAt: -1 },
    ],
  }
);

const LabTest = mongoose.model("LabTest", labTestSchema);
const LabTestRequest = mongoose.model("LabTestRequest", labTestRequestSchema);
const LabResult = mongoose.model("LabResult", labResultSchema);

export { LabTest, LabTestRequest, LabResult };
