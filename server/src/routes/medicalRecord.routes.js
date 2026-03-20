import { Router } from "express";
import {
  createMedicalRecord,
  getMedicalRecord,
  getMyMedicalRecords,
  getPatientRecords,
  updateMedicalRecord,
  addDiagnosis,
  addPrescription,
  removeDiagnosis,
  removePrescription
} from "../controllers/medicalRecord.controller.js";
import { authorize, protect } from "../middlewares/auth.middleware.js";
import { ROLES } from "../constants/roles.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  validateCreateMedicalRecord,
  validateUpdateMedicalRecord,
  validateAddDiagnosis,
  validateAddPrescription,
  validateMedicalRecordQuery,
  validateMongoIdParam
} from "../validators/medicalRecord.validation.js";

const router = Router();

// Get patient's own medical records
router.get(
  "/my",
  protect,
  validate(validateMedicalRecordQuery, "query"),
  getMyMedicalRecords
);

// Get specific medical record by ID
router.get(
  "/:id",
  protect,
  validate(validateMongoIdParam, "params"),
  getMedicalRecord
);

// Get doctor's patient records
router.get(
  "/patient/:patientId",
  protect,
  authorize(ROLES.DOCTOR, ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.NURSE),
  validate(validateMongoIdParam, "params"),
  validate(validateMedicalRecordQuery, "query"),
  getPatientRecords
);

// Create medical record (doctors only)
router.post(
  "/",
  protect,
  authorize(ROLES.DOCTOR),
  validate(validateCreateMedicalRecord),
  createMedicalRecord
);

// Update medical record (doctor who created it)
router.patch(
  "/:id",
  protect,
  authorize(ROLES.DOCTOR),
  validate(validateMongoIdParam, "params"),
  validate(validateUpdateMedicalRecord),
  updateMedicalRecord
);

// Add diagnosis (doctors only)
router.post(
  "/:id/diagnoses",
  protect,
  authorize(ROLES.DOCTOR),
  validate(validateMongoIdParam, "params"),
  validate(validateAddDiagnosis),
  addDiagnosis
);

// Add prescription (doctors only)
router.post(
  "/:id/prescriptions",
  protect,
  authorize(ROLES.DOCTOR),
  validate(validateMongoIdParam, "params"),
  validate(validateAddPrescription),
  addPrescription
);

// Remove diagnosis (doctors only)
router.delete(
  "/:id/diagnoses/:diagnosisId",
  protect,
  authorize(ROLES.DOCTOR),
  validate(validateMongoIdParam, "params"),
  removeDiagnosis
);

// Remove prescription (doctors only)
router.delete(
  "/:id/prescriptions/:prescriptionId",
  protect,
  authorize(ROLES.DOCTOR),
  validate(validateMongoIdParam, "params"),
  removePrescription
);

export default router;
