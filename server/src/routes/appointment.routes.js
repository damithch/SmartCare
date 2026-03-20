import { Router } from "express";
import {
  createAppointment,
  getAppointment,
  listAppointments,
  listAllAppointments,
  updateAppointment,
  cancelAppointment
} from "../controllers/appointment.controller.js";
import { authorize, protect } from "../middlewares/auth.middleware.js";
import { ROLES } from "../constants/roles.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  validateCreateAppointment,
  validateUpdateAppointment,
  validateAppointmentQuery,
  validateMongoIdParam
} from "../validators/appointment.validation.js";

const router = Router();

// Get all appointments (admins only)
router.get(
  "/",
  protect,
  authorize(ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  validate(validateAppointmentQuery, "query"),
  listAllAppointments
);

// Get user's appointments (patients, doctors, admins)
router.get(
  "/my",
  protect,
  validate(validateAppointmentQuery, "query"),
  listAppointments
);

// Get specific appointment by ID
router.get(
  "/:id",
  protect,
  validate(validateMongoIdParam, "params"),
  getAppointment
);

// Create appointment
router.post(
  "/",
  protect,
  validate(validateCreateAppointment),
  createAppointment
);

// Update appointment
router.patch(
  "/:id",
  protect,
  validate(validateMongoIdParam, "params"),
  validate(validateUpdateAppointment),
  updateAppointment
);

// Cancel appointment
router.delete(
  "/:id",
  protect,
  validate(validateMongoIdParam, "params"),
  cancelAppointment
);

export default router;
