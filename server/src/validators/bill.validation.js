import Joi from "joi";

// Create bill schema
export const createBillSchema = Joi.object().keys({
  patient: Joi.string().required().messages({
    "any.required": "Patient ID is required",
  }),
  appointment: Joi.string().allow(null),
  billItems: Joi.array()
    .items(
      Joi.object({
        description: Joi.string().required(),
        category: Joi.string()
          .valid("consultation", "procedure", "medicine", "test", "service", "other")
          .required(),
        quantity: Joi.number().min(1).required(),
        unitPrice: Joi.number().min(0).required(),
        totalPrice: Joi.number().min(0).required(),
        referenceId: Joi.string().allow(null),
      })
    )
    .required()
    .min(1),
  subtotal: Joi.number().min(0).required(),
  discount: Joi.number().min(0).default(0),
  discountReason: Joi.string().allow(""),
  taxPercentage: Joi.number().min(0).max(100).default(0),
  insuranceCoverage: Joi.number().min(0).default(0),
  dueDate: Joi.date().allow(null),
  notes: Joi.string().allow(""),
});

// Update bill schema (partial updates)
export const updateBillSchema = Joi.object().keys({
  discount: Joi.number().min(0),
  discountReason: Joi.string().allow(""),
  insuranceCoverage: Joi.number().min(0),
  dueDate: Joi.date().allow(null),
  notes: Joi.string().allow(""),
  status: Joi.string().valid("draft", "pending", "partial", "paid", "overdue", "cancelled"),
});

// Add bill item schema
export const addBillItemSchema = Joi.object().keys({
  description: Joi.string().required(),
  category: Joi.string()
    .valid("consultation", "procedure", "medicine", "test", "service", "other")
    .required(),
  quantity: Joi.number().min(1).required(),
  unitPrice: Joi.number().min(0).required(),
  totalPrice: Joi.number().min(0).required(),
  referenceId: Joi.string().allow(null),
});

// Process payment schema
export const processPaymentSchema = Joi.object().keys({
  amount: Joi.number().min(0.01).required().messages({
    "number.min": "Payment amount must be greater than 0",
    "any.required": "Payment amount is required",
  }),
  paymentMethod: Joi.string()
    .valid("cash", "card", "check", "insurance", "bank_transfer")
    .required()
    .messages({
      "any.required": "Payment method is required",
    }),
  referenceNumber: Joi.string().allow(""),
  notes: Joi.string().allow(""),
});

// Query filter schema
export const billFilterSchema = Joi.object().keys({
  patient: Joi.string().allow(""),
  status: Joi.string().valid("draft", "pending", "partial", "paid", "overdue", "cancelled").allow(""),
  startDate: Joi.date().allow(null),
  endDate: Joi.date().allow(null),
  minAmount: Joi.number().min(0).allow(null),
  maxAmount: Joi.number().min(0).allow(null),
  search: Joi.string().allow(""),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid("createdAt", "dueDate", "amountDue").default("createdAt"),
  sortOrder: Joi.string().valid("asc", "desc").default("desc"),
});
