import express from "express";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as billController from "../controllers/bill.controller.js";
import * as billValidation from "../validators/bill.validation.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// POST /bills - Create bill (billing staff, admin)
router.post(
  "/",
  authorize(ROLES.BILLING_STAFF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  validate(billValidation.createBillSchema, "body"),
  billController.createBill
);

// GET /bills - List bills with filters (billing staff, doctor, admin, patients see own)
router.get(
  "/",
  validate(billValidation.billFilterSchema, "query"),
  billController.getAllBills
);

// GET /bills/outstanding - Outstanding bills (billing staff, admin)
router.get(
  "/outstanding/unpaid",
  authorize(ROLES.BILLING_STAFF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.HOSPITAL_MANAGER),
  billController.getOutstandingBills
);

// GET /bills/report - Generate bill report (admin, billing staff)
router.get(
  "/report/generate",
  authorize(ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.HOSPITAL_MANAGER, ROLES.BILLING_STAFF),
  billController.generateBillReport
);

// GET /bills/:id - Get bill by ID
router.get(
  "/:id",
  billController.getBillById
);

// PATCH /bills/:id - Update bill (billing staff, admin)
router.patch(
  "/:id",
  authorize(ROLES.BILLING_STAFF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  validate(billValidation.updateBillSchema, "body"),
  billController.updateBill
);

// POST /bills/:id/items - Add item to bill (billing staff, admin)
router.post(
  "/:id/items",
  authorize(ROLES.BILLING_STAFF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  validate(billValidation.addBillItemSchema, "body"),
  billController.addItemToBill
);

// PATCH /bills/:id/status - Update bill status (auto-calculate overdue)
router.patch(
  "/:id/status",
  authorize(ROLES.BILLING_STAFF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  billController.calculateBillStatus
);

// DELETE /bills/:id - Archive bill (billing staff, admin)
router.delete(
  "/:id",
  authorize(ROLES.BILLING_STAFF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  billController.archiveBill
);

export default router;
