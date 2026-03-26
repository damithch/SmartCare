import mongoose from "mongoose";

// Bill Item Schema (for line items)
const billItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["consultation", "procedure", "medicine", "test", "service", "other"],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "billItems.category", // Dynamic reference based on category
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

// Bill Schema
const billSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    billItems: [billItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountReason: {
      type: String,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    insuranceCoverage: {
      type: Number,
      default: 0,
      min: 0,
    },
    amountDue: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["draft", "pending", "partial", "paid", "overdue", "cancelled"],
      default: "pending",
      index: true,
    },
    dueDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
    generatedBy: {
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
      { patient: 1, createdAt: -1 },
      { status: 1, dueDate: 1 },
      { billNumber: 1 },
    ],
  }
);

// Generate bill number before validation so the required field is present.
billSchema.pre("validate", async function (next) {
  if (!this.billNumber) {
    const count = await mongoose.model("Bill").countDocuments();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    this.billNumber = `BILL-${year}${month}-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

// Calculate amount due before saving
billSchema.pre("save", function (next) {
  if (this.isModified("subtotal") || this.isModified("discount") || this.isModified("taxAmount") || this.isModified("insuranceCoverage")) {
    this.amountDue = this.subtotal - this.discount + this.taxAmount - this.insuranceCoverage;
  }
  next();
});

const Bill = mongoose.model("Bill", billSchema);
export default Bill;
