import MedicalRecord from "../models/medicalRecord.model.js";
import User from "../models/user.model.js";
import Appointment from "../models/appointment.model.js";
import Bill from "../models/bill.model.js";
import Medicine from "../models/medicine.model.js";
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

const getRefId = (value) => value?._id || value;

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

const syncMedicineBillForRecord = async (record, doctorId) => {
  const prescriptions = record.prescriptions || [];
  const patientId = getRefId(record.patient);
  const appointmentId = getRefId(record.appointment);
  const billTag = `AUTO_MEDICINE_BILL:${appointmentId || record._id}`;

  if (!prescriptions.length) {
    await Bill.updateMany(
      { patient: patientId, notes: billTag, status: { $in: ["draft", "pending", "partial", "overdue"] } },
      { isActive: false, status: "cancelled" }
    );
    return null;
  }

  const medicineNames = prescriptions.map((prescription) => prescription.medicineName).filter(Boolean);
  const medicines = await Medicine.find({ name: { $in: medicineNames }, isActive: true }).select("name price");
  const medicinePriceMap = new Map(medicines.map((medicine) => [medicine.name, medicine.price]));

  const billItems = prescriptions.map((prescription) => {
    const unitPrice = Number(medicinePriceMap.get(prescription.medicineName) || 0);
    return {
      description: `${prescription.medicineName} (${prescription.dosage}, ${prescription.frequency}, ${prescription.duration})`,
      category: "medicine",
      quantity: 1,
      unitPrice,
      totalPrice: unitPrice,
      addedBy: doctorId,
      addedAt: prescription.prescribedAt || new Date()
    };
  });

  const subtotal = billItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const activeBills = await Bill.find({
    patient: patientId,
    notes: billTag,
    isActive: true
  }).sort({ createdAt: -1 });

  const paidBill = activeBills.find((item) => item.status === "paid" || Number(item.amountDue || 0) <= 0);

  if (paidBill) {
    const unpaidDuplicates = activeBills.filter(
      (item) => String(item._id) !== String(paidBill._id) && ["draft", "pending", "partial", "overdue"].includes(item.status)
    );

    await Promise.all(unpaidDuplicates.map(async (item) => {
      item.isActive = false;
      item.status = "cancelled";
      await item.save();
    }));

    return paidBill;
  }

  let bill = activeBills.find((item) => ["draft", "pending", "partial", "overdue"].includes(item.status));

  if (!bill) {
    bill = new Bill({
      patient: patientId,
      appointment: appointmentId,
      generatedBy: doctorId,
      notes: billTag
    });
  }

  bill.billItems = billItems;
  bill.subtotal = subtotal;
  bill.discount = 0;
  bill.taxPercentage = 0;
  bill.taxAmount = 0;
  bill.insuranceCoverage = 0;
  bill.amountDue = subtotal;
  bill.status = subtotal <= 0 ? "paid" : "pending";
  bill.dueDate = dueDate;
  bill.generatedBy = doctorId;
  bill.isActive = true;

  await bill.save();
  return bill;
};

const getMedicineBillTag = (record) => `AUTO_MEDICINE_BILL:${getRefId(record.appointment) || record._id}`;

const getMedicineBillForRecord = async (record) => {
  const bills = await Bill.find({
    patient: getRefId(record.patient),
    notes: getMedicineBillTag(record),
    isActive: true
  }).sort({ createdAt: -1 });

  const paidBill = bills.find((bill) => bill.status === "paid" || Number(bill.amountDue || 0) <= 0);

  if (paidBill) {
    const unpaidDuplicates = bills.filter(
      (bill) => String(bill._id) !== String(paidBill._id) && ["draft", "pending", "partial", "overdue"].includes(bill.status)
    );

    await Promise.all(unpaidDuplicates.map(async (bill) => {
      bill.isActive = false;
      bill.status = "cancelled";
      await bill.save();
    }));

    return paidBill;
  }

  return bills[0] || null;
};

const buildPrescriptionQueueItem = (record, prescription, bill) => ({
  id: `${record._id}:${prescription._id}`,
  recordId: String(record._id),
  prescriptionId: String(prescription._id),
  patientName: record.patient?.fullName || "Patient",
  patientEmail: record.patient?.email || "",
  patientPhone: record.patient?.phone || "",
  doctorName: record.doctor?.fullName || "Doctor",
  doctorSpecialization: record.doctor?.specialization || "",
  date: prescription.prescribedAt || record.createdAt,
  status: prescription.status || "pending",
  billId: bill ? String(bill._id) : "",
  billNumber: bill?.billNumber || "",
  billStatus: bill?.status || "pending",
  amountDue: Number(bill?.amountDue || 0),
  isPaid: Boolean(bill) && (bill.status === "paid" || Number(bill.amountDue || 0) <= 0),
  medicines: [
    {
      name: prescription.medicineName,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
      duration: prescription.duration,
      notes: prescription.instructions || ""
    }
  ]
});

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
    ...(diagnosis.id && !String(diagnosis.id).includes("-") ? { _id: diagnosis.id } : {}),
    title: diagnosis.title,
    description: diagnosis.description,
    additionalNotes: diagnosis.additionalNotes,
    diagnosedBy: doctorId,
    diagnosedAt: new Date()
  }));
  record.prescriptions = (prescriptions || []).map((prescription) => ({
    ...(prescription.id && !String(prescription.id).includes("-") ? { _id: prescription.id } : {}),
    medicineName: prescription.medicineName,
    dosage: prescription.dosage,
    frequency: prescription.frequency,
    duration: prescription.duration,
    instructions: prescription.instructions,
    status: prescription.status || "pending",
    prescribedBy: doctorId,
    prescribedAt: new Date()
  }));

  await record.save();

  appointment.status = "completed";
  await appointment.save();

  await syncMedicineBillForRecord(record, doctorId);

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
    status: prescriptionData.status || "pending",
    prescribedBy: doctorId,
    prescribedAt: new Date()
  };

  record.prescriptions.push(prescription);
  await record.save();
  await syncMedicineBillForRecord(record, doctorId);

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

export const getPrescriptionQueue = async ({ status, search, limit = 100 } = {}) => {
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 100, 1), 200);
  const normalizedSearch = (search || "").trim().toLowerCase();

  const records = await MedicalRecord.find({ "prescriptions.0": { $exists: true } })
    .populate("patient", "fullName email phone avatar")
    .populate("doctor", "fullName email specialization avatar")
    .sort({ createdAt: -1 })
    .limit(safeLimit);

  const billEntries = await Promise.all(
    records.map(async (record) => {
      const bill = await getMedicineBillForRecord(record);
      if (bill) {
        return [String(record._id), bill];
      }

      const doctorId = record.doctor?._id || record.doctor;
      return [String(record._id), await syncMedicineBillForRecord(record, doctorId)];
    })
  );
  const billMap = new Map(billEntries);

  return records.flatMap((record) =>
    (record.prescriptions || [])
      .filter((prescription) => !status || prescription.status === status)
      .map((prescription) => buildPrescriptionQueueItem(record, prescription, billMap.get(String(record._id))))
      .filter((item) => {
        if (!normalizedSearch) {
          return true;
        }

        return [item.patientName, item.patientEmail, item.doctorName, item.id]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch));
      })
  );
};

export const updatePrescriptionStatus = async (recordId, prescriptionId, status) => {
  const record = await MedicalRecord.findById(recordId)
    .populate("patient", "fullName email phone avatar")
    .populate("doctor", "fullName email specialization avatar");

  if (!record) {
    throw new AppError("Medical record not found", 404, "RECORD_NOT_FOUND");
  }

  const prescription = record.prescriptions.id(prescriptionId);
  if (!prescription) {
    throw new AppError("Prescription not found", 404, "PRESCRIPTION_NOT_FOUND");
  }

  const bill = await getMedicineBillForRecord(record);

  if (status === "dispensed" && (!bill || (bill.status !== "paid" && Number(bill.amountDue || 0) > 0))) {
    throw new AppError("Patient has not completed the medicine payment", 400, "MEDICINE_PAYMENT_REQUIRED");
  }

  prescription.status = status;
  await record.save();

  return buildPrescriptionQueueItem(record, prescription, bill);
};
