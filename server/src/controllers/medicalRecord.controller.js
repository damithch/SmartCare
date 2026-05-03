import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import * as medicalRecordService from "../services/medicalRecord.service.js";

export const createMedicalRecord = asyncHandler(async (req, res) => {
  const { patientId, appointmentId, visitReason, symptoms, vitals, notes } = req.body;

  const record = await medicalRecordService.createMedicalRecord(
    { patientId, appointmentId, visitReason, symptoms, vitals, notes },
    req.user._id
  );

  res.status(201).json({
    success: true,
    message: "Medical record created successfully",
    data: record
  });
});

export const saveConsultation = asyncHandler(async (req, res) => {
  const record = await medicalRecordService.saveConsultationForAppointment(
    {
      patientId: req.body.patientId,
      appointmentId: req.body.appointmentId,
      visitReason: req.body.visitReason,
      symptoms: req.body.symptoms,
      vitals: req.body.vitals,
      diagnoses: req.body.diagnoses,
      prescriptions: req.body.prescriptions,
      notes: req.body.notes,
      followUpRequired: req.body.followUpRequired,
      followUpDate: req.body.followUpDate
    },
    req.user._id
  );

  res.status(200).json({
    success: true,
    message: "Consultation saved successfully",
    data: record
  });
});

export const getAppointmentMedicalRecord = asyncHandler(async (req, res) => {
  const record = await medicalRecordService.getMedicalRecordByAppointment(req.params.appointmentId, req.user._id);

  res.status(200).json({
    success: true,
    data: record
  });
});

export const getMedicalRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const record = await medicalRecordService.getMedicalRecordById(id);

  const canView =
    req.user._id.toString() === record.patient._id.toString() ||
    req.user._id.toString() === record.doctor._id.toString() ||
    ["admin", "system_admin", "nurse"].includes(req.user.role);

  if (!canView) {
    throw new AppError("Not authorized to view this record", 403, "FORBIDDEN");
  }

  res.status(200).json({
    success: true,
    data: record
  });
});

export const getMyMedicalRecords = asyncHandler(async (req, res) => {
  const { page, limit, status, sortBy, sortOrder } = req.query;

  const result = await medicalRecordService.getPatientMedicalRecords(req.user._id, {
    page,
    limit,
    status,
    sortBy,
    sortOrder
  });

  res.status(200).json({
    success: true,
    data: result.records,
    pagination: result.pagination
  });
});

export const getPatientRecords = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { page, limit, status, sortBy, sortOrder } = req.query;

  const result = await medicalRecordService.getDoctorPatientRecords(req.user._id, {
    page,
    limit,
    patientId,
    status,
    sortBy,
    sortOrder
  });

  res.status(200).json({
    success: true,
    data: result.records,
    pagination: result.pagination
  });
});

export const getPrescriptionQueue = asyncHandler(async (req, res) => {
  const { status, search, limit } = req.query;

  const queue = await medicalRecordService.getPrescriptionQueue({ status, search, limit });

  res.status(200).json({
    success: true,
    data: queue
  });
});

export const updateMedicalRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { visitReason, symptoms, vitals, notes, followUpRequired, followUpDate, status } = req.body;

  const record = await medicalRecordService.updateMedicalRecord(
    id,
    { visitReason, symptoms, vitals, notes, followUpRequired, followUpDate, status },
    req.user._id
  );

  res.status(200).json({
    success: true,
    message: "Medical record updated successfully",
    data: record
  });
});

export const addDiagnosis = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, additionalNotes } = req.body;

  const record = await medicalRecordService.addDiagnosis(
    id,
    { title, description, additionalNotes },
    req.user._id
  );

  res.status(201).json({
    success: true,
    message: "Diagnosis added successfully",
    data: record
  });
});

export const addPrescription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { medicineName, dosage, frequency, duration, instructions } = req.body;

  const record = await medicalRecordService.addPrescription(
    id,
    { medicineName, dosage, frequency, duration, instructions },
    req.user._id
  );

  res.status(201).json({
    success: true,
    message: "Prescription added successfully",
    data: record
  });
});

export const removeDiagnosis = asyncHandler(async (req, res) => {
  const { id, diagnosisId } = req.params;

  const record = await medicalRecordService.removeDiagnosis(id, diagnosisId, req.user._id);

  res.status(200).json({
    success: true,
    message: "Diagnosis removed successfully",
    data: record
  });
});

export const removePrescription = asyncHandler(async (req, res) => {
  const { id, prescriptionId } = req.params;

  const record = await medicalRecordService.removePrescription(id, prescriptionId, req.user._id);

  res.status(200).json({
    success: true,
    message: "Prescription removed successfully",
    data: record
  });
});

export const updatePrescriptionStatus = asyncHandler(async (req, res) => {
  const { id, prescriptionId } = req.params;
  const { status } = req.body;

  const prescription = await medicalRecordService.updatePrescriptionStatus(id, prescriptionId, status);

  res.status(200).json({
    success: true,
    message: "Prescription status updated successfully",
    data: prescription
  });
});
