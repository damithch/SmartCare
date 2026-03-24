import Payment from "../models/payment.model.js";
import Refund from "../models/refund.model.js";
import Bill from "../models/bill.model.js";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js";
import { ROLES } from "../constants/roles.js";

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

  // Validate amount doesn't exceed bill amount
  if (amount > bill.amountDue) {
    throw new AppError(`Payment amount cannot exceed due amount of ${bill.amountDue}`, 400, "INVALID_PAYMENT_AMOUNT");
  }

  const payment = new Payment({
    bill: billId,
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
    status: "completed",
  });

  await payment.save();

  // Update bill status
  const remainingBalance = bill.amountDue - amount;
  if (remainingBalance === 0) {
    bill.status = "paid";
  } else if (remainingBalance < bill.amountDue) {
    bill.status = "partial";
  }
  await bill.save();

  return payment
    .populate("bill")
    .populate("patient", "fullName email phone")
    .populate("processedBy", "fullName email");
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

  return refund.populate("payment").populate("bill").populate("patient", "fullName email");
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

  return refund.populate("payment").populate("bill").populate("patient", "fullName email");
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
    bill.amountDue += refund.refundAmount;
    if (bill.status === "paid" && bill.amountDue > 0) {
      bill.status = "partial";
    }
    await bill.save();
  }

  return refund.populate("payment").populate("bill").populate("patient", "fullName email");
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
