import mongoose from "mongoose";

const diagnosisSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    additionalNotes: String,
    diagnosedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    diagnosedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: true,
      trim: true
    },
    dosage: {
      type: String,
      required: true,
      trim: true
    },
    frequency: {
      type: String,
      required: true,
      enum: ["Once daily", "Twice daily", "Three times daily", "Four times daily", "As needed"]
    },
    duration: {
      type: String,
      required: true,
      trim: true
    },
    prescribedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    instructions: String,
    prescribedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: false }
);

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: false
    },
    visitReason: {
      type: String,
      required: true,
      trim: true
    },
    symptoms: {
      type: String,
      required: true,
      trim: true
    },
    vitals: {
      bloodPressure: String,
      temperature: String,
      heartRate: String,
      respiratoryRate: String,
      weight: String,
      height: String
    },
    diagnoses: [diagnosisSchema],
    prescriptions: [prescriptionSchema],
    notes: {
      type: String,
      trim: true
    },
    followUpRequired: {
      type: Boolean,
      default: false
    },
    followUpDate: Date,
    status: {
      type: String,
      enum: ["completed", "pending", "archived"],
      default: "completed"
    }
  },
  { timestamps: true }
);

const MedicalRecord = mongoose.model("MedicalRecord", medicalRecordSchema);

export default MedicalRecord;
