import asyncHandler from "../utils/asyncHandler.js";
import * as appointmentService from "../services/appointment.service.js";
import { getIO } from "../socket.js";

export const createAppointment = asyncHandler(async (req, res) => {
  const { patientId, doctorId, appointmentDate, availabilityId } = req.body;

  const appointment = await appointmentService.createAppointment(
    { patientId, doctorId, appointmentDate, availabilityId },
    req.user._id,
    req.user.role
  );

  const io = getIO();
  io.emit('notification', {
    type: 'success',
    message: `New appointment created`
  });

  res.status(201).json({
    success: true,
    message: "Appointment created successfully",
    data: appointment
  });
});

export const createAppointmentCheckout = asyncHandler(async (req, res) => {
  const checkout = await appointmentService.createAppointmentCheckout(
    {
      patientId: req.body.patientId,
      doctorId: req.body.doctorId,
      availabilityId: req.body.availabilityId
    },
    req.user._id,
    req.user.role
  );

  res.status(201).json({
    success: true,
    message: "Payment intent created successfully",
    data: checkout
  });
});

export const confirmAppointmentPayment = asyncHandler(async (req, res) => {
  const appointment = await appointmentService.confirmAppointmentPayment(
    {
      patientId: req.body.patientId,
      doctorId: req.body.doctorId,
      availabilityId: req.body.availabilityId,
      paymentIntentId: req.body.paymentIntentId
    },
    req.user._id,
    req.user.role
  );

  const io = getIO();
  io.emit('notification', {
    type: 'success',
    message: `New appointment booked and paid`
  });

  res.status(201).json({
    success: true,
    message: "Appointment booked and paid successfully",
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

export const listPatientUpcomingAppointments = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const appointments = await appointmentService.getPatientUpcomingAppointments(
    id,
    req.user._id,
    req.user.role
  );

  res.status(200).json({
    success: true,
    data: appointments
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

  const io = getIO();
  io.emit('notification', {
    type: 'success',
    message: `Appointment status updated to ${status || 'new status'}`
  });

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

  const io = getIO();
  io.emit('notification', {
    type: 'warning',
    message: `Appointment cancelled`
  });

  res.status(200).json({
    success: true,
    message: "Appointment cancelled successfully",
    data: appointment
  });
});
