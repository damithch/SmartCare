import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import * as appointmentService from "../services/appointment.service.js";

export const createAppointment = asyncHandler(async (req, res) => {
  const { patientId, doctorId, appointmentDate } = req.body;

  const appointment = await appointmentService.createAppointment(
    { patientId, doctorId, appointmentDate },
    req.user._id,
    req.user.role
  );

  res.status(201).json({
    success: true,
    message: "Appointment created successfully",
    data: appointment
  });
});

export const getAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const appointment = await appointmentService.getAppointmentById(id);

  res.status(200).json({
    success: true,
    data: appointment
  });
});

export const listAppointments = asyncHandler(async (req, res) => {
  const { page, limit, status, sortBy, sortOrder } = req.query;

  const result = await appointmentService.getUserAppointments(
    req.user._id,
    req.user.role,
    { page, limit, status, sortBy, sortOrder }
  );

  res.status(200).json({
    success: true,
    data: result.appointments,
    pagination: result.pagination
  });
});

export const listAllAppointments = asyncHandler(async (req, res) => {
  const { page, limit, status, doctorId, patientId, sortBy, sortOrder } = req.query;

  const result = await appointmentService.getAllAppointments({
    page,
    limit,
    status,
    doctorId,
    patientId,
    sortBy,
    sortOrder
  });

  res.status(200).json({
    success: true,
    data: result.appointments,
    pagination: result.pagination
  });
});

export const updateAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { appointmentDate, status } = req.body;

  const appointment = await appointmentService.updateAppointment(
    id,
    { appointmentDate, status },
    req.user._id,
    req.user.role
  );

  res.status(200).json({
    success: true,
    message: "Appointment updated successfully",
    data: appointment
  });
});

export const cancelAppointment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const appointment = await appointmentService.cancelAppointment(
    id,
    req.user._id,
    req.user.role
  );

  res.status(200).json({
    success: true,
    message: "Appointment cancelled successfully",
    data: appointment
  });
});
