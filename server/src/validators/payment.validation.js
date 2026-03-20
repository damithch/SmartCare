import Joi from "joi";

// Process payment schema
export const processPaymentSchema = Joi.object().keys({
  bill: Joi.string().required().messages({
    "any.required": "Bill ID is required",
  }),
  amount: Joi.number().min(0.01).required().messages({
    "number.min": "Payment amount must be greater than 0",
    "any.required": "Payment amount is required",
  }),
  paymentMethod: Joi.string()
    .valid("cash", "card", "check", "insurance", "bank_transfer", "other")
    .required()
    .messages({
      "any.required": "Payment method is required",
    }),
  cardDetails: Joi.object({
    cardNumber: Joi.string(),
    cardHolder: Joi.string(),
    expiryDate: Joi.string(),
  }).allow(null),
  checkDetails: Joi.object({
    checkNumber: Joi.string(),
    bankName: Joi.string(),
  }).allow(null),
  insuranceDetails: Joi.object({
    insuranceProvider: Joi.string(),
    policyNumber: Joi.string(),
    claimNumber: Joi.string(),
  }).allow(null),
  bankTransferDetails: Joi.object({
    bankName: Joi.string(),
    accountNumber: Joi.string(),
    transferReference: Joi.string(),
  }).allow(null),
  transactionReference: Joi.string().allow(""),
  description: Joi.string().allow(""),
});

// Update payment status schema
export const updatePaymentStatusSchema = Joi.object().keys({
  status: Joi.string()
    .valid("pending", "completed", "failed", "cancelled")
    .required(),
  notes: Joi.string().allow(""),
});

// Reconciliation schema
export const reconciliationSchema = Joi.object().keys({
  paymentIds: Joi.array().items(Joi.string()).min(1).required(),
  reconciliationNotes: Joi.string().allow(""),
});

// Refund request schema
export const refundRequestSchema = Joi.object().keys({
  payment: Joi.string().required().messages({
    "any.required": "Payment ID is required",
  }),
  refundAmount: Joi.number().min(0.01).required().messages({
    "number.min": "Refund amount must be greater than 0",
  }),
  refundReason: Joi.string()
    .valid("duplicate_payment", "overpayment", "cancellation", "returned_medicine", "adjustment", "other")
    .required(),
  refundReasonDetails: Joi.string().allow(""),
  refundMethod: Joi.string()
    .valid("original_method", "cash", "check", "bank_transfer")
    .required(),
  refundMethodDetails: Joi.object({
    bankName: Joi.string(),
    accountNumber: Joi.string(),
    checkNumber: Joi.string(),
    transactionReference: Joi.string(),
  }).allow(null),
});

// Approve refund schema
export const approveRefundSchema = Joi.object().keys({
  approved: Joi.boolean().required(),
  rejectionReason: Joi.string().when("approved", {
    is: false,
    then: Joi.required(),
    otherwise: Joi.allow(""),
  }),
  notes: Joi.string().allow(""),
});

// Payment filter/query schema
export const paymentFilterSchema = Joi.object().keys({
  bill: Joi.string().allow(""),
  patient: Joi.string().allow(""),
  status: Joi.string()
    .valid("pending", "completed", "failed", "cancelled", "refunded")
    .allow(""),
  paymentMethod: Joi.string()
    .valid("cash", "card", "check", "insurance", "bank_transfer", "other")
    .allow(""),
  startDate: Joi.date().allow(null),
  endDate: Joi.date().allow(null),
  minAmount: Joi.number().min(0).allow(null),
  maxAmount: Joi.number().min(0).allow(null),
  reconciled: Joi.string().valid("true", "false").allow(""),
  search: Joi.string().allow(""),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid("createdAt", "amount", "status").default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

// Refund filter/query schema
export const refundFilterSchema = Joi.object().keys({
  payment: Joi.string().allow(""),
  patient: Joi.string().allow(""),
  status: Joi.string()
    .valid("pending", "approved", "processing", "completed", "declined")
    .allow(""),
  refundReason: Joi.string()
    .valid("duplicate_payment", "overpayment", "cancellation", "returned_medicine", "adjustment", "other")
    .allow(""),
  startDate: Joi.date().allow(null),
  endDate: Joi.date().allow(null),
  minAmount: Joi.number().min(0).allow(null),
  maxAmount: Joi.number().min(0).allow(null),
  search: Joi.string().allow(""),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid("createdAt", "refundAmount", "status").default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});

// Receipt generation schema
export const receiptGenerationSchema = Joi.object().keys({
  hospitaName: Joi.string().required(),
  hospitalAddress: Joi.string().required(),
  contactNumber: Joi.string().required(),
});
