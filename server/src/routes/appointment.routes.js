import { Router } from "express";
import {
  createAppointment,
  createAppointmentCheckout,
  confirmAppointmentPayment,
  getAppointment,
  listAppointments,
  listAllAppointments,
  listPatientUpcomingAppointments,
  updateAppointment,
  cancelAppointment
} from "../controllers/appointment.controller.js";
import { authorize, protect } from "../middlewares/auth.middleware.js";
import { ROLES } from "../constants/roles.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  validateCreateAppointment,
  validateAppointmentCheckout,
  validateConfirmAppointmentPayment,
  validateUpdateAppointment,
  validateAppointmentQuery,
  validateMongoIdParam
} from "../validators/appointment.validation.js";

const router = Router();

router.get(
  "/",
  protect,
  authorize(ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  validate(validateAppointmentQuery, "query"),
  listAllAppointments
);

router.get(
  "/my",
  protect,
  validate(validateAppointmentQuery, "query"),
  listAppointments
);

router.post(
  "/checkout-intent",
  protect,
  authorize(ROLES.PATIENT, ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  validate(validateAppointmentCheckout),
  createAppointmentCheckout
);

router.post(
  "/confirm-payment",
  protect,
  authorize(ROLES.PATIENT, ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  validate(validateConfirmAppointmentPayment),
  confirmAppointmentPayment
);

router.get(
  "/patient/:id/upcoming",
  protect,
  authorize(ROLES.DOCTOR, ROLES.NURSE, ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.PATIENT),
  validate(validateMongoIdParam, "params"),
  listPatientUpcomingAppointments
);

router.get(
  "/:id",
  protect,
  validate(validateMongoIdParam, "params"),
  getAppointment
);

router.post(
  "/",
  protect,
  validate(validateCreateAppointment),
  createAppointment
);

router.patch(
  "/:id",
  protect,
  validate(validateMongoIdParam, "params"),
  validate(validateUpdateAppointment),
  updateAppointment
);

router.delete(
  "/:id",
  protect,
  validate(validateMongoIdParam, "params"),
  cancelAppointment
);

export default router;
