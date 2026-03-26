import mongoose from "mongoose";

const doctorAvailabilitySchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    date: {
      type: String,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      min: 0,
      default: 0
    },
    maxPatients: {
      type: Number,
      min: 1,
      default: 1
    },
    bookedCount: {
      type: Number,
      min: 0,
      default: 0
    },
    isBooked: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

doctorAvailabilitySchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true });

const DoctorAvailability = mongoose.model("DoctorAvailability", doctorAvailabilitySchema);

export default DoctorAvailability;
