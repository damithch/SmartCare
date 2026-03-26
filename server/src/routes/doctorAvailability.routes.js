import { Router } from "express";
import { ROLES } from "../constants/roles.js";
import { authorize, protect } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createMyAvailability,
  deleteMyAvailability,
  getDoctorAvailability,
  getMyAvailability
} from "../controllers/doctorAvailability.controller.js";
import {
  validateAvailabilityIdParam,
  validateDoctorAvailabilityLookup,
  validateAvailabilityQuery,
  validateCreateAvailability
} from "../validators/doctorAvailability.validation.js";

const router = Router();

router.get("/", protect, authorize(ROLES.PATIENT, ROLES.DOCTOR, ROLES.ADMIN, ROLES.SYSTEM_ADMIN), validate(validateDoctorAvailabilityLookup, "query"), getDoctorAvailability);
router.get("/me", protect, authorize(ROLES.DOCTOR), validate(validateAvailabilityQuery, "query"), getMyAvailability);
router.post("/me", protect, authorize(ROLES.DOCTOR), validate(validateCreateAvailability), createMyAvailability);
router.delete("/me/:id", protect, authorize(ROLES.DOCTOR), validate(validateAvailabilityIdParam, "params"), deleteMyAvailability);

export default router;
