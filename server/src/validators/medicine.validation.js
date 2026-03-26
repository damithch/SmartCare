import Joi from "joi";

export const validateAddMedicine = Joi.object({
  name: Joi.string()
    .max(200)
    .required()
    .messages({
      "string.empty": "Medicine name is required",
      "string.max": "Medicine name cannot exceed 200 characters"
    }),
  description: Joi.string().max(500).optional(),
  category: Joi.string()
    .valid(
      "Antibiotic",
      "Antiviral",
      "Painkiller",
      "Antihistamine",
      "Antacid",
      "Vitamin",
      "Supplement",
      "Other"
    )
    .required()
    .messages({
      "any.only":
        "Category must be one of: Antibiotic, Antiviral, Painkiller, Antihistamine, Antacid, Vitamin, Supplement, Other",
      "string.empty": "Category is required"
    }),
  dosageForm: Joi.string()
    .valid("Tablet", "Capsule", "Liquid", "Injection", "Cream", "Ointment", "Spray", "Syrup")
    .required()
    .messages({
      "any.only":
        "Dosage form must be one of: Tablet, Capsule, Liquid, Injection, Cream, Ointment, Spray, Syrup",
      "string.empty": "Dosage form is required"
    }),
  strength: Joi.string()
    .max(100)
    .required()
    .messages({
      "string.empty": "Strength is required",
      "string.max": "Strength cannot exceed 100 characters"
    }),
  manufacturer: Joi.string()
    .max(200)
    .required()
    .messages({
      "string.empty": "Manufacturer is required",
      "string.max": "Manufacturer cannot exceed 200 characters"
    }),
  batchNumber: Joi.string()
    .max(50)
    .required()
    .messages({
      "string.empty": "Batch number is required",
      "string.max": "Batch number cannot exceed 50 characters"
    }),
  manufacturingDate: Joi.date().optional(),
  expiryDate: Joi.date()
    .min("now")
    .required()
    .messages({
      "date.base": "Invalid expiry date format",
      "date.min": "Expiry date cannot be in the past",
      "any.required": "Expiry date is required"
    }),
  quantity: Joi.number()
    .min(0)
    .required()
    .messages({
      "number.min": "Quantity must be at least 0",
      "any.required": "Quantity is required"
    }),
  unit: Joi.string()
    .valid("pieces", "bottles", "boxes", "strips", "vials")
    .optional()
    .default("pieces"),
  price: Joi.number()
    .min(0)
    .required()
    .messages({
      "number.min": "Price must be at least 0",
      "any.required": "Price is required"
    }),
  reorderLevel: Joi.number()
    .min(0)
    .required()
    .messages({
      "number.min": "Reorder level must be at least 0",
      "any.required": "Reorder level is required"
    })
});

export const validateUpdateMedicine = Joi.object({
  description: Joi.string().max(500).optional(),
  quantity: Joi.number().min(0).optional(),
  price: Joi.number().min(0).optional(),
  reorderLevel: Joi.number().min(0).optional(),
  isActive: Joi.boolean().optional()
}).min(1);

export const validateUpdateStock = Joi.object({
  quantityChange: Joi.number()
    .required()
    .messages({
      "number.base": "Quantity change must be a number",
      "any.required": "Quantity change is required"
    }),
  reason: Joi.string()
    .valid("restock", "dispense", "expiry", "damage", "adjustment")
    .required()
    .messages({
      "any.only": "Reason must be one of: restock, dispense, expiry, damage, adjustment",
      "string.empty": "Reason is required"
    }),
  notes: Joi.string().max(500).optional()
});

export const validateMedicineQuery = Joi.object({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).max(100).optional(),
  category: Joi.string().optional(),
  search: Joi.string().max(200).optional(),
  expiringWithin: Joi.number()
    .min(1)
    .optional()
    .messages({
      "number.min": "Expiring within days must be at least 1"
    }),
  lowStock: Joi.boolean().optional(),
  sortBy: Joi.string()
    .valid("name", "quantity", "expiryDate", "price", "createdAt")
    .optional(),
  sortOrder: Joi.string()
    .valid("asc", "desc")
    .optional()
});

export const validateMongoIdParam = Joi.object({
  id: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      "string.pattern.base": "Invalid medicine ID format",
      "string.empty": "Medicine ID is required"
    })
});
