import mongoose from "mongoose";

// Refund Schema
const refundSchema = new mongoose.Schema(
  {
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      index: true,
    },
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
    originalPaymentAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    refundAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    refundReason: {
      type: String,
      enum: ["duplicate_payment", "overpayment", "cancellation", "returned_medicine", "adjustment", "other"],
      required: true,
    },
    refundReasonDetails: String,
    refundMethod: {
      type: String,
      enum: ["original_method", "cash", "check", "bank_transfer"],
      required: true,
    },
    refundMethodDetails: {
      bankName: String,
      accountNumber: String,
      checkNumber: String,
      transactionReference: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "processing", "completed", "declined"],
      default: "pending",
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    processedAt: Date,
    rejectionReason: String,
    notes: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { payment: 1 },
      { bill: 1 },
      { patient: 1, status: 1 },
      { status: 1, createdAt: -1 },
    ],
  }
);

const Refund = mongoose.model("Refund", refundSchema);
export default Refund;
