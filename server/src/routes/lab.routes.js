import express from "express";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import * as labController from "../controllers/lab.controller.js";
import * as labValidation from "../validators/lab.validation.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// ============ LAB TEST CATALOG ROUTES ============

// POST /lab/tests - Add lab test (admin only)
router.post(
  "/tests",
  authorize(ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  validate(labValidation.addLabTestSchema, "body"),
  labController.addLabTest
);

// GET /lab/tests - Get all lab tests (public, authenticated)
router.get(
  "/tests",
  validate(labValidation.labTestFilterSchema, "query"),
  labController.getAllLabTests
);

// GET /lab/tests/:id - Get lab test by ID
router.get(
  "/tests/:id",
  labController.getLabTestById
);

// PATCH /lab/tests/:id - Update lab test (admin only)
router.patch(
  "/tests/:id",
  authorize(ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  validate(labValidation.updateLabTestSchema, "body"),
  labController.updateLabTest
);

// ============ LAB TEST REQUEST ROUTES ============

// POST /lab/requests - Create lab test request (doctor, admin)
router.post(
  "/requests",
  authorize(ROLES.DOCTOR, ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  validate(labValidation.createLabTestRequestSchema, "body"),
  labController.createLabTestRequest
);

// GET /lab/requests - Get lab test requests (doctor sees own, patient sees own, admin sees all)
router.get(
  "/requests",
  validate(labValidation.testRequestFilterSchema, "query"),
  labController.getLabTestRequests
);

// PATCH /lab/requests/:id - Update test request status
router.patch(
  "/requests/:id",
  authorize(ROLES.DOCTOR, ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.STAFF),
  validate(labValidation.updateTestRequestStatusSchema, "body"),
  labController.updateTestRequestStatus
);

// ============ LAB RESULT ROUTES ============

// POST /lab/results - Create lab result (lab staff, doctor, admin)
router.post(
  "/results",
  authorize(ROLES.STAFF, ROLES.DOCTOR, ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  validate(labValidation.createLabResultSchema, "body"),
  labController.createLabResult
);

// GET /lab/results - Get lab results
router.get(
  "/results",
  validate(labValidation.labResultFilterSchema, "query"),
  labController.getLabResults
);

// PATCH /lab/results/:id - Update lab result
router.patch(
  "/results/:id",
  authorize(ROLES.STAFF, ROLES.DOCTOR, ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  validate(labValidation.updateLabResultSchema, "body"),
  labController.updateLabResult
);

// PATCH /lab/results/:id/approve - Approve/Review lab result (doctor, admin)
router.patch(
  "/results/:id/approve",
  authorize(ROLES.DOCTOR, ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  validate(labValidation.approveResultSchema, "body"),
  labController.approveLabResult
);

// ============ LAB STATISTICS/REPORT ROUTES ============

// GET /lab/report - Get lab statistics and reports (admin, doctor)
router.get(
  "/report/generate",
  authorize(ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.DOCTOR, ROLES.HOSPITAL_MANAGER),
  labController.getLabReport
);

export default router;
