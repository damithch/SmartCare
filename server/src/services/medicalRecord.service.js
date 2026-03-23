import MedicalRecord from "../models/medicalRecord.model.js";
import User from "../models/user.model.js";
import Appointment from "../models/appointment.model.js";
import AppError from "../utils/appError.js";
import { ROLES } from "../constants/roles.js";

const populateRecordById = (recordId) =>
  MedicalRecord.findById(recordId)
    .populate("patient", "fullName email phone avatar")
    .populate("doctor", "fullName email")
    .populate({
      path: "appointment",
      populate: [
        { path: "patient", select: "fullName email phone avatar" },
        { path: "doctor", select: "fullName email specialization avatar" }
      ]
    });

const getValidatedAppointment = async (appointmentId, patientId, doctorId) => {
  if (!appointmentId) {
    return null;
  }

  const appointment = await Appointment.findById(appointmentId)
    .populate("patient", "fullName email phone avatar")
    .populate("doctor", "fullName email specialization avatar");

  if (!appointment) {
    throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");
  }

  if (appointment.doctor._id.toString() !== doctorId.toString()) {
    throw new AppError("Appointment does not belong to this doctor", 403, "FORBIDDEN");
  }

  if (patientId && appointment.patient._id.toString() !== patientId.toString()) {
    throw new AppError("Appointment does not belong to this patient", 400, "PATIENT_APPOINTMENT_MISMATCH");
  }

  return appointment;
};

export const createMedicalRecord = async (
  { patientId, appointmentId, visitReason, symptoms, vitals, notes },
  doctorId
) => {
  const patient = await User.findById(patientId);
  if (!patient) {
    throw new AppError("Patient not found", 404, "PATIENT_NOT_FOUND");
  }

  if (!patient.isActive) {
    throw new AppError("Patient account is deactivated", 403, "PATIENT_DEACTIVATED");
  }

  const doctor = await User.findById(doctorId);
  if (!doctor || doctor.role !== ROLES.DOCTOR) {
    throw new AppError("Invalid doctor", 400, "INVALID_DOCTOR");
  }

  if (!doctor.isActive) {
    throw new AppError("Doctor account is deactivated", 403, "DOCTOR_DEACTIVATED");
  }

  await getValidatedAppointment(appointmentId, patientId, doctorId);

  const medicalRecord = await MedicalRecord.create({
    patient: patientId,
    doctor: doctorId,
    appointment: appointmentId || undefined,
    visitReason,
    symptoms,
    vitals: vitals || {},
    notes
  });

  return populateRecordById(medicalRecord._id);
};

export const saveConsultationForAppointment = async (
  { patientId, appointmentId, visitReason, symptoms, vitals, diagnoses, prescriptions, notes, followUpRequired, followUpDate },
  doctorId
) => {
  const patient = await User.findById(patientId);
  if (!patient) {
    throw new AppError("Patient not found", 404, "PATIENT_NOT_FOUND");
  }

  const appointment = await getValidatedAppointment(appointmentId, patientId, doctorId);

  let record = await MedicalRecord.findOne({ appointment: appointmentId, doctor: doctorId });

  if (!record) {
    record = new MedicalRecord({
      patient: patientId,
      doctor: doctorId,
      appointment: appointmentId
    });
  }

  record.visitReason = visitReason;
  record.symptoms = symptoms;
  record.vitals = vitals || {};
  record.notes = notes || "";
  record.followUpRequired = Boolean(followUpRequired);
  record.followUpDate = followUpRequired && followUpDate ? followUpDate : undefined;
  record.status = "completed";
  record.diagnoses = (diagnoses || []).map((diagnosis) => ({
    title: diagnosis.title,
    description: diagnosis.description,
    additionalNotes: diagnosis.additionalNotes,
    diagnosedBy: doctorId,
    diagnosedAt: new Date()
  }));
  record.prescriptions = (prescriptions || []).map((prescription) => ({
    medicineName: prescription.medicineName,
    dosage: prescription.dosage,
    frequency: prescription.frequency,
    duration: prescription.duration,
    instructions: prescription.instructions,
    prescribedBy: doctorId,
    prescribedAt: new Date()
  }));

  await record.save();

  appointment.status = "completed";
  await appointment.save();

  return populateRecordById(record._id);
};

export const getMedicalRecordByAppointment = async (appointmentId, doctorId) => {
  await getValidatedAppointment(appointmentId, null, doctorId);

  const record = await MedicalRecord.findOne({ appointment: appointmentId, doctor: doctorId })
    .populate("patient", "fullName email phone avatar")
    .populate("doctor", "fullName email")
    .populate({
      path: "appointment",
      populate: [
        { path: "patient", select: "fullName email phone avatar" },
        { path: "doctor", select: "fullName email specialization avatar" }
      ]
    });

  if (!record) {
    return null;
  }

  return record;
};

export const getMedicalRecordById = async (recordId) => {
  const record = await populateRecordById(recordId);

  if (!record) {
    throw new AppError("Medical record not found", 404, "RECORD_NOT_FOUND");
  }

  return record;
};

export const getPatientMedicalRecords = async (
  patientId,
  { page = 1, limit = 10, status, sortBy = "createdAt", sortOrder = "desc" } = {}
) => {
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), 100);
  const safeSortOrder = sortOrder === "asc" ? 1 : -1;
  const allowedSortFields = ["createdAt", "updatedAt", "followUpDate"];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

  const query = { patient: patientId };
  if (status) query.status = status;

  const skip = (safePage - 1) * safeLimit;

  const [records, total] = await Promise.all([
    MedicalRecord.find(query)
      .populate("doctor", "fullName email")
      .sort({ [safeSortBy]: safeSortOrder })
      .skip(skip)
      .limit(safeLimit),
    MedicalRecord.countDocuments(query)
  ]);

  return {
    records,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1
    }
  };
};

export const getDoctorPatientRecords = async (
  doctorId,
  { page = 1, limit = 10, patientId, status, sortBy = "createdAt", sortOrder = "desc" } = {}
) => {
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), 100);
  const safeSortOrder = sortOrder === "asc" ? 1 : -1;
  const allowedSortFields = ["createdAt", "updatedAt", "followUpDate"];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

  const query = { doctor: doctorId };
  if (patientId) query.patient = patientId;
  if (status) query.status = status;

  const skip = (safePage - 1) * safeLimit;

  const [records, total] = await Promise.all([
    MedicalRecord.find(query)
      .populate("patient", "fullName email phone avatar")
      .populate("appointment")
      .sort({ [safeSortBy]: safeSortOrder })
      .skip(skip)
      .limit(safeLimit),
    MedicalRecord.countDocuments(query)
  ]);

  return {
    records,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1
    }
  };
};

export const updateMedicalRecord = async (recordId, payload, doctorId) => {
  const record = await MedicalRecord.findById(recordId);
  if (!record) {
    throw new AppError("Medical record not found", 404, "RECORD_NOT_FOUND");
  }

  if (record.doctor.toString() !== doctorId.toString()) {
    throw new AppError("Not authorized to update this record", 403, "FORBIDDEN");
  }

  if (payload.visitReason !== undefined) record.visitReason = payload.visitReason;
  if (payload.symptoms !== undefined) record.symptoms = payload.symptoms;
  if (payload.vitals !== undefined) record.vitals = { ...record.vitals, ...payload.vitals };
  if (payload.notes !== undefined) record.notes = payload.notes;
  if (payload.followUpRequired !== undefined) record.followUpRequired = payload.followUpRequired;
  if (payload.followUpDate !== undefined) record.followUpDate = payload.followUpDate;
  if (payload.status !== undefined) record.status = payload.status;

  await record.save();
  return populateRecordById(recordId);
};

export const addDiagnosis = async (recordId, diagnosisData, doctorId) => {
  const record = await MedicalRecord.findById(recordId);
  if (!record) {
    throw new AppError("Medical record not found", 404, "RECORD_NOT_FOUND");
  }

  if (record.doctor.toString() !== doctorId.toString()) {
    throw new AppError("Not authorized to add diagnosis to this record", 403, "FORBIDDEN");
  }

  const diagnosis = {
    title: diagnosisData.title,
    description: diagnosisData.description,
    additionalNotes: diagnosisData.additionalNotes,
    diagnosedBy: doctorId,
    diagnosedAt: new Date()
  };

  record.diagnoses.push(diagnosis);
  await record.save();

  return populateRecordById(recordId);
};

export const addPrescription = async (recordId, prescriptionData, doctorId) => {
  const record = await MedicalRecord.findById(recordId);
  if (!record) {
    throw new AppError("Medical record not found", 404, "RECORD_NOT_FOUND");
  }

  if (record.doctor.toString() !== doctorId.toString()) {
    throw new AppError("Not authorized to add prescription to this record", 403, "FORBIDDEN");
  }

  const prescription = {
    medicineName: prescriptionData.medicineName,
    dosage: prescriptionData.dosage,
    frequency: prescriptionData.frequency,
    duration: prescriptionData.duration,
    instructions: prescriptionData.instructions,
    prescribedBy: doctorId,
    prescribedAt: new Date()
  };

  record.prescriptions.push(prescription);
  await record.save();

  return populateRecordById(recordId);
};

export const removeDiagnosis = async (recordId, diagnosisId, doctorId) => {
  const record = await MedicalRecord.findById(recordId);
  if (!record) {
    throw new AppError("Medical record not found", 404, "RECORD_NOT_FOUND");
  }

  if (record.doctor.toString() !== doctorId.toString()) {
    throw new AppError("Not authorized to modify this record", 403, "FORBIDDEN");
  }

  const diagnosis = record.diagnoses.id(diagnosisId);
  if (!diagnosis) {
    throw new AppError("Diagnosis not found", 404, "DIAGNOSIS_NOT_FOUND");
  }

  record.diagnoses.pull(diagnosisId);
  await record.save();

  return populateRecordById(recordId);
};

export const removePrescription = async (recordId, prescriptionId, doctorId) => {
  const record = await MedicalRecord.findById(recordId);
  if (!record) {
    throw new AppError("Medical record not found", 404, "RECORD_NOT_FOUND");
  }

  if (record.doctor.toString() !== doctorId.toString()) {
    throw new AppError("Not authorized to modify this record", 403, "FORBIDDEN");
  }

  const prescription = record.prescriptions.id(prescriptionId);
  if (!prescription) {
    throw new AppError("Prescription not found", 404, "PRESCRIPTION_NOT_FOUND");
  }

  record.prescriptions.pull(prescriptionId);
  await record.save();

  return populateRecordById(recordId);
};
