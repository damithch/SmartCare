import Appointment from "../models/appointment.model.js";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js";
import { ROLES } from "../constants/roles.js";

export const createAppointment = async ({ patientId, doctorId, appointmentDate }, userId, userRole) => {
  // Validate users exist
  const [patient, doctor] = await Promise.all([
    User.findById(patientId),
    User.findById(doctorId)
  ]);

  if (!patient) {
    throw new AppError("Patient not found", 404, "PATIENT_NOT_FOUND");
  }

  if (!doctor) {
    throw new AppError("Doctor not found", 404, "DOCTOR_NOT_FOUND");
  }

  if (doctor.role !== ROLES.DOCTOR) {
    throw new AppError("Selected user is not a doctor", 400, "INVALID_DOCTOR");
  }

  // Check if patient is deactivated
  if (!patient.isActive) {
    throw new AppError("Patient account is deactivated", 403, "PATIENT_DEACTIVATED");
  }

  if (!doctor.isActive) {
    throw new AppError("Doctor account is deactivated", 403, "DOCTOR_DEACTIVATED");
  }

  // Only patients can book their own appointments, admins can book for anyone
  if (userRole === ROLES.PATIENT && userId.toString() !== patientId) {
    throw new AppError("Patients can only book appointments for themselves", 403, "FORBIDDEN");
  }

  const appointment = await Appointment.create({
    patient: patientId,
    doctor: doctorId,
    appointmentDate,
    status: "scheduled"
  });

  return Appointment.findById(appointment._id)
    .populate("patient", "fullName email")
    .populate("doctor", "fullName email");
};

export const getAppointmentById = async (appointmentId) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate("patient", "fullName email")
    .populate("doctor", "fullName email");

  if (!appointment) {
    throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");
  }

  return appointment;
};

export const getUserAppointments = async (userId, userRole, { page = 1, limit = 10, status, sortBy = "appointmentDate", sortOrder = "asc" } = {}) => {
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), 100);
  const safeSortOrder = sortOrder === "desc" ? -1 : 1;
  const allowedSortFields = ["appointmentDate", "createdAt", "updatedAt"];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "appointmentDate";

  const query = {};

  // Filter based on user role
  if (userRole === ROLES.PATIENT) {
    query.patient = userId;
  } else if (userRole === ROLES.DOCTOR) {
    query.doctor = userId;
  }
  // Admins can see all appointments

  if (status) {
    query.status = status;
  }

  const skip = (safePage - 1) * safeLimit;

  const [appointments, total] = await Promise.all([
    Appointment.find(query)
      .populate("patient", "fullName email")
      .populate("doctor", "fullName email")
      .sort({ [safeSortBy]: safeSortOrder })
      .skip(skip)
      .limit(safeLimit),
    Appointment.countDocuments(query)
  ]);

  return {
    appointments,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1
    }
  };
};

export const getAllAppointments = async ({ page = 1, limit = 10, status, doctorId, patientId, sortBy = "appointmentDate", sortOrder = "asc" } = {}) => {
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), 100);
  const safeSortOrder = sortOrder === "desc" ? -1 : 1;
  const allowedSortFields = ["appointmentDate", "createdAt", "updatedAt"];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "appointmentDate";

  const query = {};

  if (status) query.status = status;
  if (doctorId) query.doctor = doctorId;
  if (patientId) query.patient = patientId;

  const skip = (safePage - 1) * safeLimit;

  const [appointments, total] = await Promise.all([
    Appointment.find(query)
      .populate("patient", "fullName email")
      .populate("doctor", "fullName email")
      .sort({ [safeSortBy]: safeSortOrder })
      .skip(skip)
      .limit(safeLimit),
    Appointment.countDocuments(query)
  ]);

  return {
    appointments,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1
    }
  };
};

export const updateAppointment = async (appointmentId, { appointmentDate, status }, userId, userRole) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");
  }

  // Only patients/doctors of this appointment or admins can update
  const isPatient = userRole === ROLES.PATIENT && appointment.patient.toString() === userId.toString();
  const isDoctor = userRole === ROLES.DOCTOR && appointment.doctor.toString() === userId.toString();
  const isAdmin = [ROLES.ADMIN, ROLES.SYSTEM_ADMIN].includes(userRole);

  if (!isPatient && !isDoctor && !isAdmin) {
    throw new AppError("Not authorized to update this appointment", 403, "FORBIDDEN");
  }

  if (appointmentDate !== undefined) {
    appointment.appointmentDate = appointmentDate;
  }

  if (status !== undefined) {
    appointment.status = status;
  }

  await appointment.save();
  return Appointment.findById(appointmentId)
    .populate("patient", "fullName email")
    .populate("doctor", "fullName email");
};

export const cancelAppointment = async (appointmentId, userId, userRole) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");
  }

  if (appointment.status === "cancelled") {
    throw new AppError("Appointment is already cancelled", 400, "ALREADY_CANCELLED");
  }

  if (appointment.status === "completed") {
    throw new AppError("Cannot cancel a completed appointment", 400, "CANNOT_CANCEL_COMPLETED");
  }

  // Only patients/doctors of this appointment or admins can cancel
  const isPatient = userRole === ROLES.PATIENT && appointment.patient.toString() === userId.toString();
  const isDoctor = userRole === ROLES.DOCTOR && appointment.doctor.toString() === userId.toString();
  const isAdmin = [ROLES.ADMIN, ROLES.SYSTEM_ADMIN].includes(userRole);

  if (!isPatient && !isDoctor && !isAdmin) {
    throw new AppError("Not authorized to cancel this appointment", 403, "FORBIDDEN");
  }

  appointment.status = "cancelled";
  await appointment.save();

  return Appointment.findById(appointmentId)
    .populate("patient", "fullName email")
    .populate("doctor", "fullName email");
};
