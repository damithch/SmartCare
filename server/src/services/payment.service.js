import Stripe from "stripe";
import Payment from "../models/payment.model.js";
import Refund from "../models/refund.model.js";
import Bill from "../models/bill.model.js";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js";
import { ROLES } from "../constants/roles.js";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" })
  : null;

const ensureStripe = () => {
  if (!stripe) {
    throw new AppError("Stripe is not configured on the server", 500, "STRIPE_NOT_CONFIGURED");
  }

  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    throw new AppError("Stripe publishable key is missing", 500, "STRIPE_NOT_CONFIGURED");
  }

  return stripe;
};

const applyBillPayment = async ({
  bill,
  amount,
  paymentMethod,
  transactionReference,
  description,
  processedBy,
  cardDetails,
  checkDetails,
  insuranceDetails,
  bankTransferDetails
}) => {
  const originalAmountDue = Number(bill.amountDue || 0);
  const existingPayment = transactionReference
    ? await Payment.findOne({ transactionReference, status: "completed" })
    : null;

  if (existingPayment) {
    return existingPayment.populate([
      { path: "bill" },
      { path: "patient", select: "fullName email phone" },
      { path: "processedBy", select: "fullName email" }
    ]);
  }

  if (bill.status === "cancelled") {
    throw new AppError("Cancelled bills cannot be paid", 400, "BILL_PAYMENT_NOT_ALLOWED");
  }

  if (bill.status === "paid" || originalAmountDue <= 0) {
    throw new AppError("This bill has already been paid", 409, "BILL_ALREADY_PAID");
  }

  if (amount > originalAmountDue) {
    throw new AppError(`Payment amount cannot exceed due amount of ${originalAmountDue}`, 400, "INVALID_PAYMENT_AMOUNT");
  }

  const payment = new Payment({
    bill: bill._id,
    patient: bill.patient,
    amount,
    paymentMethod,
    cardDetails,
    checkDetails,
    insuranceDetails,
    bankTransferDetails,
    transactionReference,
    description,
    processedBy,
    status: "completed"
  });

  await payment.save();

  const remainingBalance = Math.max(0, originalAmountDue - amount);
  bill.amountPaid = Number(bill.amountPaid || 0) + amount;
  bill.amountDue = remainingBalance;
  if (remainingBalance === 0) {
    bill.status = "paid";
  } else if (remainingBalance < originalAmountDue) {
    bill.status = "partial";
  }
  await bill.save();

  return payment.populate([
    { path: "bill" },
    { path: "patient", select: "fullName email phone" },
    { path: "processedBy", select: "fullName email" }
  ]);
};

// 1. Process payment
export const processPayment = async (paymentData, processedBy, processedByRole) => {
  const { bill: billId, amount, paymentMethod, cardDetails, checkDetails, insuranceDetails, bankTransferDetails, transactionReference, description } = paymentData;

  // Validate bill exists and get details
  const bill = await Bill.findById(billId);
  if (!bill) {
    throw new AppError("Bill not found", 404, "BILL_NOT_FOUND");
  }

  if (processedByRole === ROLES.PATIENT && bill.patient.toString() !== processedBy.toString()) {
    throw new AppError("Patients can only pay their own bills", 403, "FORBIDDEN");
  }

  return applyBillPayment({
    bill,
    amount,
    paymentMethod,
    cardDetails,
    checkDetails,
    insuranceDetails,
    bankTransferDetails,
    transactionReference,
    description,
    processedBy
  });
};

export const createBillCheckout = async ({ bill: billId }, processedBy, processedByRole) => {
  const stripeClient = ensureStripe();
  const bill = await Bill.findById(billId).populate("patient", "fullName email phone");

  if (!bill) {
    throw new AppError("Bill not found", 404, "BILL_NOT_FOUND");
  }

  const patientId = bill.patient?._id || bill.patient;
  if (processedByRole === ROLES.PATIENT && patientId.toString() !== processedBy.toString()) {
    throw new AppError("Patients can only pay their own bills", 403, "FORBIDDEN");
  }

  if (bill.status === "cancelled") {
    throw new AppError("Cancelled bills cannot be paid", 400, "BILL_PAYMENT_NOT_ALLOWED");
  }

  const amountDue = Number(bill.amountDue || 0);
  if (bill.status === "paid" || amountDue <= 0) {
    throw new AppError("This bill has already been paid", 409, "BILL_ALREADY_PAID");
  }

  const paymentIntent = await stripeClient.paymentIntents.create({
    amount: Math.round(amountDue * 100),
    currency: process.env.STRIPE_CURRENCY || "usd",
    payment_method_types: ["card"],
    receipt_email: bill.patient?.email,
    metadata: {
      billId: String(bill._id),
      patientId: String(patientId),
      billNumber: bill.billNumber || ""
    },
    description: `SmartCare medicine bill ${bill.billNumber || bill._id}`
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    amount: amountDue,
    currency: paymentIntent.currency,
    billId: String(bill._id),
    billNumber: bill.billNumber
  };
};

export const confirmBillPayment = async ({ bill: billId, paymentIntentId }, processedBy, processedByRole) => {
  const stripeClient = ensureStripe();
  const bill = await Bill.findById(billId);

  if (!bill) {
    throw new AppError("Bill not found", 404, "BILL_NOT_FOUND");
  }

  if (processedByRole === ROLES.PATIENT && bill.patient.toString() !== processedBy.toString()) {
    throw new AppError("Patients can only pay their own bills", 403, "FORBIDDEN");
  }

  const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

  if (!paymentIntent) {
    throw new AppError("Stripe payment not found", 404, "PAYMENT_NOT_FOUND");
  }

  if (paymentIntent.status !== "succeeded") {
    throw new AppError("Payment has not been completed", 400, "PAYMENT_NOT_COMPLETED");
  }

  if (
    paymentIntent.metadata.billId !== String(bill._id) ||
    paymentIntent.metadata.patientId !== String(bill.patient)
  ) {
    throw new AppError("Payment does not match this bill", 400, "PAYMENT_MISMATCH");
  }

  const amountPaid = Number(((paymentIntent.amount_received || paymentIntent.amount) / 100).toFixed(2));

  return applyBillPayment({
    bill,
    amount: Math.min(amountPaid, Number(bill.amountDue || 0)),
    paymentMethod: "card",
    transactionReference: paymentIntent.id,
    description: `Stripe payment for ${bill.billNumber || bill._id}`,
    processedBy,
    cardDetails: {
      brand: paymentIntent.payment_method_types?.[0] || "card"
    }
  });
};

// 2. Get payment by ID
export const getPaymentById = async (paymentId) => {
  const payment = await Payment.findById(paymentId)
    .populate("bill")
    .populate("patient", "fullName email phone")
    .populate("processedBy", "fullName email");

  if (!payment) {
    throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
  }

  return payment;
};

// 3. Get all payments with filters
export const getAllPayments = async (filters) => {
  const { bill, patient, status, paymentMethod, startDate, endDate, minAmount, maxAmount, reconciled, search, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = filters;

  const query = { isActive: true };

  if (bill) query.bill = bill;
  if (patient) query.patient = patient;
  if (status) query.status = status;
  if (paymentMethod) query.paymentMethod = paymentMethod;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (minAmount !== undefined || maxAmount !== undefined) {
    query.amount = {};
    if (minAmount !== undefined) query.amount.$gte = minAmount;
    if (maxAmount !== undefined) query.amount.$lte = maxAmount;
  }

  if (reconciled === "true") query.reconciled = true;
  if (reconciled === "false") query.reconciled = false;

  if (search) {
    query.$or = [
      { transactionReference: new RegExp(search, "i") },
      { description: new RegExp(search, "i") },
    ];
  }

  const skip = (page - 1) * limit;
  const sortObj = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const payments = await Payment.find(query)
    .sort(sortObj)
    .skip(skip)
    .limit(limit)
    .populate("bill", "billNumber amountDue")
    .populate("patient", "fullName email");

  const total = await Payment.countDocuments(query);

  return {
    payments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// 4. Generate receipt
export const generateReceipt = async (paymentId, receiptDetails) => {
  const payment = await Payment.findById(paymentId).populate("bill").populate("patient");

  if (!payment) {
    throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
  }

  if (!payment.receipt) {
    const count = await Payment.countDocuments({ "receipt": { $exists: true } });
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");

    payment.receipt = {
      receiptNumber: `RCP-${year}${month}-${String(count + 1).padStart(5, "0")}`,
      generatedAt: new Date(),
      receiptDetails,
      patientInfo: {
        fullName: payment.patient.fullName,
        email: payment.patient.email,
        phone: payment.patient.phone,
      },
      billInfo: {
        billNumber: payment.bill.billNumber,
        billAmount: payment.bill.amountDue,
      },
      paymentSummary: {
        amountPaid: payment.amount,
        paymentMethod: payment.paymentMethod,
        transactionReference: payment.transactionReference,
      },
    };

    await payment.save();
  }

  return payment;
};

// 5. Reconcile payments
export const reconcilePayments = async (paymentIds, reconciledBy, notes) => {
  const payments = await Payment.updateMany(
    { _id: { $in: paymentIds } },
    {
      reconciled: true,
      reconciledAt: new Date(),
      reconciledBy,
      notes,
    }
  );

  return payments;
};

// 6. Get unreconciled payments
export const getUnreconciledPayments = async (filters) => {
  const { startDate, endDate, minAmount, maxAmount, page = 1, limit = 10 } = filters;

  const query = { isActive: true, reconciled: false };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (minAmount !== undefined || maxAmount !== undefined) {
    query.amount = {};
    if (minAmount !== undefined) query.amount.$gte = minAmount;
    if (maxAmount !== undefined) query.amount.$lte = maxAmount;
  }

  const skip = (page - 1) * limit;

  const payments = await Payment.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("bill", "billNumber")
    .populate("patient", "fullName");

  const total = await Payment.countDocuments(query);

  return {
    payments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// 7. Request refund
export const requestRefund = async (refundData, requestedBy) => {
  const { payment: paymentId, refundAmount, refundReason, refundReasonDetails, refundMethod, refundMethodDetails } = refundData;

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");
  }

  if (refundAmount > payment.amount) {
    throw new AppError(`Refund amount cannot exceed original payment of ${payment.amount}`, 400, "INVALID_REFUND_AMOUNT");
  }

  const refund = new Refund({
    payment: paymentId,
    bill: payment.bill,
    patient: payment.patient,
    originalPaymentAmount: payment.amount,
    refundAmount,
    refundReason,
    refundReasonDetails,
    refundMethod,
    refundMethodDetails,
    status: "pending",
  });

  await refund.save();

  return refund.populate([
    { path: "payment" },
    { path: "bill" },
    { path: "patient", select: "fullName email" },
  ]);
};

// 8. Approve/Decline refund
export const approveRefund = async (refundId, approved, approvedBy, rejectionReason, notes) => {
  const refund = await Refund.findById(refundId);
  if (!refund) {
    throw new AppError("Refund request not found", 404, "REFUND_NOT_FOUND");
  }

  if (approved) {
    refund.status = "approved";
    refund.approvedBy = approvedBy;
    refund.approvedAt = new Date();
  } else {
    refund.status = "declined";
    refund.rejectionReason = rejectionReason;
  }

  refund.notes = notes;
  await refund.save();

  return refund.populate([
    { path: "payment" },
    { path: "bill" },
    { path: "patient", select: "fullName email" },
  ]);
};

// 9. Process refund
export const processRefund = async (refundId, processedBy) => {
  const refund = await Refund.findById(refundId).populate("payment");
  if (!refund) {
    throw new AppError("Refund request not found", 404, "REFUND_NOT_FOUND");
  }

  if (refund.status !== "approved") {
    throw new AppError("Only approved refunds can be processed", 400, "REFUND_NOT_APPROVED");
  }

  refund.status = "processing";
  refund.processedBy = processedBy;
  refund.processedAt = new Date();
  await refund.save();

  // Update payment with refund info
  const payment = refund.payment;
  payment.isRefunded = true;
  payment.refundedAmount = refund.refundAmount;
  payment.refund = refundId;
  payment.status = "refunded";
  await payment.save();

  // Update bill status
  const bill = await Bill.findById(refund.bill);
  if (bill) {
    bill.amountPaid = Math.max(0, Number(bill.amountPaid || 0) - Number(refund.refundAmount || 0));
    bill.amountDue += refund.refundAmount;
    if (bill.status === "paid" && bill.amountDue > 0) {
      bill.status = "partial";
    }
    await bill.save();
  }

  return refund.populate([
    { path: "payment" },
    { path: "bill" },
    { path: "patient", select: "fullName email" },
  ]);
};

// 10. Get payment/reconciliation report
export const getPaymentReport = async (filters) => {
  const { startDate, endDate, paymentMethod, reconciled } = filters;

  const query = { isActive: true };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (paymentMethod) query.paymentMethod = paymentMethod;
  if (reconciled !== undefined) query.reconciled = reconciled === "true";

  const payments = await Payment.find(query).populate("bill").populate("patient", "fullName");

  const report = {
    totalTransactions: payments.length,
    totalAmount: 0,
    totalReconciled: 0,
    totalUnreconciled: 0,
    paymentsByMethod: {},
    paymentsByStatus: {},
    reconciliationRate: 0,
  };

  payments.forEach((payment) => {
    report.totalAmount += payment.amount;

    if (payment.reconciled) {
      report.totalReconciled += payment.amount;
    } else {
      report.totalUnreconciled += payment.amount;
    }

    // Count by method
    report.paymentsByMethod[payment.paymentMethod] = (report.paymentsByMethod[payment.paymentMethod] || 0) + payment.amount;

    // Count by status
    report.paymentsByStatus[payment.status] = (report.paymentsByStatus[payment.status] || 0) + 1;
  });

  report.reconciliationRate = payments.length > 0 ? ((report.totalReconciled / report.totalAmount) * 100).toFixed(2) : 0;

  // Get refund summary
  const refunds = await Refund.find({
    status: "completed",
    createdAt: query.createdAt || { $gte: new Date(0) },
  });

  report.totalRefunds = refunds.length;
  report.totalRefundedAmount = refunds.reduce((sum, r) => sum + r.refundAmount, 0);

  return report;
};
