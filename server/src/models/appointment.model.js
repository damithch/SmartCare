import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
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
    availabilitySlot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorAvailability"
    },
    appointmentDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "cancelled"],
      default: "pending"
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending"
    },
    paymentIntentId: {
      type: String,
      unique: true,
      sparse: true
    },
    amountPaid: {
      type: Number,
      min: 0,
      default: 0
    },
    paymentCurrency: {
      type: String,
      default: "usd"
    }
  },
  { timestamps: true }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
