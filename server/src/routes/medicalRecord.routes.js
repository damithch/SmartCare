import { Router } from "express";
import {
  createMedicalRecord,
  saveConsultation,
  getAppointmentMedicalRecord,
  getMedicalRecord,
  getMyMedicalRecords,
  getPatientRecords,
  getPrescriptionQueue,
  updateMedicalRecord,
  addDiagnosis,
  addPrescription,
  removeDiagnosis,
  removePrescription,
  updatePrescriptionStatus
} from "../controllers/medicalRecord.controller.js";
import { authorize, protect } from "../middlewares/auth.middleware.js";
import { ROLES } from "../constants/roles.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  validateCreateMedicalRecord,
  validateConsultationPayload,
  validateUpdateMedicalRecord,
  validateAddDiagnosis,
  validateAddPrescription,
  validateMedicalRecordQuery,
  validateMongoIdParam,
  validateAppointmentMedicalRecordParam,
  validatePatientMedicalRecordParam,
  validateMedicalRecordPrescriptionParam,
  validatePrescriptionQueueQuery,
  validatePrescriptionStatusUpdate
} from "../validators/medicalRecord.validation.js";

const router = Router();

router.get(
  "/my",
  protect,
  validate(validateMedicalRecordQuery, "query"),
  getMyMedicalRecords
);

router.get(
  "/prescriptions/queue",
  protect,
  authorize(ROLES.PHARMACIST, ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.DOCTOR),
  validate(validatePrescriptionQueueQuery, "query"),
  getPrescriptionQueue
);

router.get(
  "/appointment/:appointmentId",
  protect,
  authorize(ROLES.DOCTOR, ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.NURSE),
  validate(validateAppointmentMedicalRecordParam, "params"),
  getAppointmentMedicalRecord
);

router.get(
  "/:id",
  protect,
  validate(validateMongoIdParam, "params"),
  getMedicalRecord
);

router.get(
  "/patient/:patientId",
  protect,
  authorize(ROLES.DOCTOR, ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.NURSE),
  validate(validatePatientMedicalRecordParam, "params"),
  validate(validateMedicalRecordQuery, "query"),
  getPatientRecords
);

router.post(
  "/consultation",
  protect,
  authorize(ROLES.DOCTOR),
  validate(validateConsultationPayload),
  saveConsultation
);

router.post(
  "/",
  protect,
  authorize(ROLES.DOCTOR),
  validate(validateCreateMedicalRecord),
  createMedicalRecord
);

router.patch(
  "/:id",
  protect,
  authorize(ROLES.DOCTOR),
  validate(validateMongoIdParam, "params"),
  validate(validateUpdateMedicalRecord),
  updateMedicalRecord
);

router.post(
  "/:id/diagnoses",
  protect,
  authorize(ROLES.DOCTOR),
  validate(validateMongoIdParam, "params"),
  validate(validateAddDiagnosis),
  addDiagnosis
);

router.post(
  "/:id/prescriptions",
  protect,
  authorize(ROLES.DOCTOR),
  validate(validateMongoIdParam, "params"),
  validate(validateAddPrescription),
  addPrescription
);

router.delete(
  "/:id/diagnoses/:diagnosisId",
  protect,
  authorize(ROLES.DOCTOR),
  validate(validateMongoIdParam, "params"),
  removeDiagnosis
);

router.delete(
  "/:id/prescriptions/:prescriptionId",
  protect,
  authorize(ROLES.DOCTOR),
  validate(validateMedicalRecordPrescriptionParam, "params"),
  removePrescription
);

router.patch(
  "/:id/prescriptions/:prescriptionId/status",
  protect,
  authorize(ROLES.PHARMACIST, ROLES.ADMIN, ROLES.SYSTEM_ADMIN),
  validate(validateMedicalRecordPrescriptionParam, "params"),
  validate(validatePrescriptionStatusUpdate),
  updatePrescriptionStatus
);

export default router;
