import asyncHandler from "../utils/asyncHandler.js";
import * as paymentService from "../services/payment.service.js";
import AppError from "../utils/appError.js";
import { ROLES } from "../constants/roles.js";

// Process payment
export const processPayment = asyncHandler(async (req, res) => {
  // Only billing staff, receptionist, and admin can process payments
  if (![ROLES.BILLING_STAFF, ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.PATIENT].includes(req.user.role)) {
    throw new AppError("Only authorized users can process payments", 403, "FORBIDDEN");
  }

  const payment = await paymentService.processPayment(req.body, req.user._id, req.user.role);

  return res.status(201).json({
    success: true,
    message: "Payment processed successfully",
    data: payment,
  });
});

// Get all payments
export const getAllPayments = asyncHandler(async (req, res) => {
  // Authorization: billing staff, admin, patients see own
  if (![ROLES.BILLING_STAFF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.HOSPITAL_MANAGER, ROLES.PATIENT].includes(req.user.role)) {
    throw new AppError("Unauthorized to view payments", 403, "FORBIDDEN");
  }

  // Patients can only see their own payments
  if (req.user.role === ROLES.PATIENT) {
    req.query.patient = req.user._id.toString();
  }

  const result = await paymentService.getAllPayments(req.query);

  return res.status(200).json({
    success: true,
    message: "Payments retrieved successfully",
    data: result.payments,
    pagination: result.pagination,
  });
});

// Get payment by ID
export const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await paymentService.getPaymentById(req.params.id);

  // Authorization: Patients can only view their own payments
  if (req.user.role === ROLES.PATIENT && payment.patient._id.toString() !== req.user._id.toString()) {
    throw new AppError("Unauthorized to view this payment", 403, "FORBIDDEN");
  }

  return res.status(200).json({
    success: true,
    message: "Payment retrieved successfully",
    data: payment,
  });
});

// Generate receipt
export const generateReceipt = asyncHandler(async (req, res) => {
  // Only billing staff and admin can generate receipts
  if (![ROLES.BILLING_STAFF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN].includes(req.user.role)) {
    throw new AppError("Only billing staff can generate receipts", 403, "FORBIDDEN");
  }

  const payment = await paymentService.generateReceipt(req.params.id, req.body);

  return res.status(200).json({
    success: true,
    message: "Receipt generated successfully",
    data: payment,
  });
});

// Reconcile payments
export const reconcilePayments = asyncHandler(async (req, res) => {
  // Only admin and billing staff can reconcile
  if (![ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.BILLING_STAFF].includes(req.user.role)) {
    throw new AppError("Only admin can reconcile payments", 403, "FORBIDDEN");
  }

  const result = await paymentService.reconcilePayments(req.body.paymentIds, req.user._id, req.body.reconciliationNotes);

  return res.status(200).json({
    success: true,
    message: "Payments reconciled successfully",
    data: result,
  });
});

// Get unreconciled payments
export const getUnreconciledPayments = asyncHandler(async (req, res) => {
  // Only billing staff and admin
  if (![ROLES.BILLING_STAFF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN].includes(req.user.role)) {
    throw new AppError("Unauthorized to view unreconciled payments", 403, "FORBIDDEN");
  }

  const result = await paymentService.getUnreconciledPayments(req.query);

  return res.status(200).json({
    success: true,
    message: "Unreconciled payments retrieved successfully",
    data: result.payments,
    pagination: result.pagination,
  });
});

// Request refund
export const requestRefund = asyncHandler(async (req, res) => {
  // Only billing staff, receptionist, and admin can request refunds
  if (![ROLES.BILLING_STAFF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.RECEPTIONIST].includes(req.user.role)) {
    throw new AppError("Only billing staff can request refunds", 403, "FORBIDDEN");
  }

  const refund = await paymentService.requestRefund(req.body, req.user._id);

  return res.status(201).json({
    success: true,
    message: "Refund request created successfully",
    data: refund,
  });
});

// Approve/Decline refund
export const approveRefund = asyncHandler(async (req, res) => {
  // Only admin can approve refunds
  if (![ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.HOSPITAL_MANAGER].includes(req.user.role)) {
    throw new AppError("Only admin can approve refunds", 403, "FORBIDDEN");
  }

  const refund = await paymentService.approveRefund(
    req.params.id,
    req.body.approved,
    req.user._id,
    req.body.rejectionReason,
    req.body.notes
  );

  return res.status(200).json({
    success: true,
    message: req.body.approved ? "Refund approved successfully" : "Refund declined successfully",
    data: refund,
  });
});

// Process refund
export const processRefund = asyncHandler(async (req, res) => {
  // Only billing staff and admin
  if (![ROLES.BILLING_STAFF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN].includes(req.user.role)) {
    throw new AppError("Only billing staff can process refunds", 403, "FORBIDDEN");
  }

  const refund = await paymentService.processRefund(req.params.id, req.user._id);

  return res.status(200).json({
    success: true,
    message: "Refund processed successfully",
    data: refund,
  });
});

// Get payment report
export const getPaymentReport = asyncHandler(async (req, res) => {
  // Only admin and billing staff
  if (![ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.HOSPITAL_MANAGER, ROLES.BILLING_STAFF].includes(req.user.role)) {
    throw new AppError("Unauthorized to generate reports", 403, "FORBIDDEN");
  }

  const report = await paymentService.getPaymentReport(req.query);

  return res.status(200).json({
    success: true,
    message: "Payment report generated successfully",
    data: report,
  });
});
