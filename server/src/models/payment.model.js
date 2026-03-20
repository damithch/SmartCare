import mongoose from "mongoose";

// Receipt Schema (embedded in Payment)
const receiptSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
  receiptDetails: {
    hospitaName: String,
    hospitalAddress: String,
    contactNumber: String,
  },
  patientInfo: {
    fullName: String,
    email: String,
    phone: String,
  },
  billInfo: {
    billNumber: String,
    billAmount: Number,
  },
  paymentSummary: {
    amountPaid: Number,
    paymentMethod: String,
    transactionReference: String,
  },
});

// Payment Schema
const paymentSchema = new mongoose.Schema(
  {
    bill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      required: true,
      index: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "check", "insurance", "bank_transfer", "other"],
      required: true,
    },
    // Payment method specific details
    cardDetails: {
      cardNumber: String, // Last 4 digits only
      cardHolder: String,
      expiryDate: String,
    },
    checkDetails: {
      checkNumber: String,
      bankName: String,
    },
    insuranceDetails: {
      insuranceProvider: String,
      policyNumber: String,
      claimNumber: String,
    },
    bankTransferDetails: {
      bankName: String,
      accountNumber: String,
      transferReference: String,
    },
    // Payment status
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },
    transactionReference: {
      type: String,
      unique: true,
      sparse: true,
    },
    description: String,
    // Receipt generation
    receipt: receiptSchema,
    // Reconciliation
    reconciled: {
      type: Boolean,
      default: false,
      index: true,
    },
    reconciledAt: Date,
    reconciledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Refund tracking
    refund: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Refund",
    },
    isRefunded: {
      type: Boolean,
      default: false,
    },
    refundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Audit fields
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { bill: 1, createdAt: -1 },
      { patient: 1, status: 1 },
      { transactionReference: 1 },
      { reconciled: 1, reconciledAt: -1 },
    ],
  }
);

// Pre-save hook to auto-generate transaction reference
paymentSchema.pre("save", async function (next) {
  if (!this.transactionReference) {
    const count = await mongoose.model("Payment").countDocuments();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    this.transactionReference = `PAY-${year}${month}-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

// Index for finding payments by patient and date
paymentSchema.index({ patient: 1, createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
