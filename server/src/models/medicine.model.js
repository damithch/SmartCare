import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Antibiotic",
        "Antiviral",
        "Painkiller",
        "Antihistamine",
        "Antacid",
        "Vitamin",
        "Supplement",
        "Other"
      ]
    },
    dosageForm: {
      type: String,
      required: true,
      enum: ["Tablet", "Capsule", "Liquid", "Injection", "Cream", "Ointment", "Spray", "Syrup"]
    },
    strength: {
      type: String,
      required: true,
      trim: true
    },
    manufacturer: {
      type: String,
      required: true,
      trim: true
    },
    batchNumber: {
      type: String,
      required: true,
      trim: true
    },
    manufacturingDate: Date,
    expiryDate: {
      type: Date,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      enum: ["pieces", "bottles", "boxes", "strips", "vials"],
      default: "pieces"
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    reorderLevel: {
      type: Number,
      required: true,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

// Index for frequently searched fields
medicineSchema.index({ name: 1, category: 1, expiryDate: 1 });

const Medicine = mongoose.model("Medicine", medicineSchema);

export default Medicine;
