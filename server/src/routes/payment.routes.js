import express from "express";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as paymentController from "../controllers/payment.controller.js";
import * as paymentValidation from "../validators/payment.validation.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// POST /payments - Process payment (billing staff, receptionist, admin)
router.post(
  "/",
  authorize(ROLES.BILLING_STAFF, ROLES.RECEPTIONIST, ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  validate(paymentValidation.processPaymentSchema, "body"),
  paymentController.processPayment
);

// GET /payments - List payments (billing staff, admin, patients see own)
router.get(
  "/",
  validate(paymentValidation.paymentFilterSchema, "query"),
  paymentController.getAllPayments
);

// GET /payments/unreconciled - Unreconciled payments (billing staff, admin)
router.get(
  "/unreconciled/list",
  authorize(ROLES.BILLING_STAFF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  paymentController.getUnreconciledPayments
);

// GET /payments/report - Payment report (admin, billing staff)
router.get(
  "/report/generate",
  authorize(ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.HOSPITAL_MANAGER, ROLES.BILLING_STAFF),
  paymentController.getPaymentReport
);

// GET /payments/:id - Get payment by ID
router.get(
  "/:id",
  paymentController.getPaymentById
);

// POST /payments/:id/receipt - Generate receipt (billing staff, admin)
router.post(
  "/:id/receipt",
  authorize(ROLES.BILLING_STAFF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  validate(paymentValidation.receiptGenerationSchema, "body"),
  paymentController.generateReceipt
);

// PATCH /payments/reconcile - Reconcile payments (admin, billing staff)
router.patch(
  "/reconcile/batch",
  authorize(ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.BILLING_STAFF),
  validate(paymentValidation.reconciliationSchema, "body"),
  paymentController.reconcilePayments
);

// POST /payments/refund/request - Request refund (billing staff, admin)
router.post(
  "/refund/request",
  authorize(ROLES.BILLING_STAFF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.RECEPTIONIST),
  validate(paymentValidation.refundRequestSchema, "body"),
  paymentController.requestRefund
);

// PATCH /payments/refund/:id/approve - Approve refund (admin)
router.patch(
  "/refund/:id/approve",
  authorize(ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.HOSPITAL_MANAGER),
  validate(paymentValidation.approveRefundSchema, "body"),
  paymentController.approveRefund
);

// POST /payments/refund/:id/process - Process refund (billing staff, admin)
router.post(
  "/refund/:id/process",
  authorize(ROLES.BILLING_STAFF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  paymentController.processRefund
);

export default router;
