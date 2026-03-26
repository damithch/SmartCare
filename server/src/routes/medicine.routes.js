import { Router } from "express";
import {
  addMedicine,
  getMedicine,
  getAllMedicines,
  updateMedicine,
  updateStock,
  checkAvailability,
  getExpiringMedicines,
  getLowStockMedicines,
  archiveMedicine
} from "../controllers/medicine.controller.js";
import { authorize, protect } from "../middlewares/auth.middleware.js";
import { ROLES } from "../constants/roles.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  validateAddMedicine,
  validateUpdateMedicine,
  validateUpdateStock,
  validateMedicineQuery,
  validateMongoIdParam
} from "../validators/medicine.validation.js";

const router = Router();

// Get all medicines (pharmacist, doctor, admin can view)
router.get(
  "/",
  protect,
  authorize(ROLES.PHARMACIST, ROLES.DOCTOR, ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  validate(validateMedicineQuery, "query"),
  getAllMedicines
);

// Get medicines expiring soon (pharmacist, admin)
router.get(
  "/expiring/soon",
  protect,
  authorize(ROLES.PHARMACIST, ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  getExpiringMedicines
);

// Get low stock medicines (pharmacist, admin)
router.get(
  "/inventory/low-stock",
  protect,
  authorize(ROLES.PHARMACIST, ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  getLowStockMedicines
);

// Get specific medicine by ID
router.get(
  "/:id",
  protect,
  authorize(ROLES.PHARMACIST, ROLES.DOCTOR, ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  validate(validateMongoIdParam, "params"),
  getMedicine
);

// Check medicine availability
router.post(
  "/:id/check-availability",
  protect,
  authorize(ROLES.PHARMACIST, ROLES.DOCTOR, ROLES.ADMIN),
  validate(validateMongoIdParam, "params"),
  checkAvailability
);

// Add new medicine (pharmacist only)
router.post(
  "/",
  protect,
  authorize(ROLES.PHARMACIST),
  validate(validateAddMedicine),
  addMedicine
);

// Update medicine details (pharmacist only)
router.patch(
  "/:id",
  protect,
  authorize(ROLES.PHARMACIST),
  validate(validateMongoIdParam, "params"),
  validate(validateUpdateMedicine),
  updateMedicine
);

// Update stock (pharmacist only)
router.patch(
  "/:id/stock",
  protect,
  authorize(ROLES.PHARMACIST),
  validate(validateMongoIdParam, "params"),
  validate(validateUpdateStock),
  updateStock
);

// Archive medicine (pharmacist only)
router.delete(
  "/:id",
  protect,
  authorize(ROLES.PHARMACIST),
  validate(validateMongoIdParam, "params"),
  archiveMedicine
);

export default router;
