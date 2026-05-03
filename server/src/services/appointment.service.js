import Stripe from "stripe";
import Appointment from "../models/appointment.model.js";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js";
import { ROLES } from "../constants/roles.js";
import DoctorAvailability from "../models/doctorAvailability.model.js";
import Refund from "../models/refund.model.js";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" })
  : null;

const APPOINTMENT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
};

const releaseAppointmentSlotCapacity = async (appointment) => {
  if (!appointment?.availabilitySlot) {
    return;
  }

  const slot = await DoctorAvailability.findById(appointment.availabilitySlot);
  if (!slot) {
    return;
  }

  slot.bookedCount = Math.max((slot.bookedCount || 0) - 1, 0);
  slot.isBooked = slot.bookedCount >= (slot.maxPatients || 1);
  await slot.save();
};

const ensureStripe = () => {
  if (!stripe) {
    throw new AppError("Stripe is not configured on the server", 500, "STRIPE_NOT_CONFIGURED");
  }

  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    throw new AppError("Stripe publishable key is missing", 500, "STRIPE_NOT_CONFIGURED");
  }

  return stripe;
};

const createStripeAppointmentRefund = async (appointment, processedBy) => {
  if (appointment.paymentStatus !== "paid" || !appointment.paymentIntentId || Number(appointment.amountPaid || 0) <= 0) {
    return null;
  }

  const existingRefund = await Refund.findOne({
    appointment: appointment._id,
    refundReason: "doctor_rejected_appointment",
    status: { $nin: ["failed", "declined", "cancelled"] }
  });

  if (existingRefund) {
    appointment.paymentStatus = existingRefund.status === "completed" ? "refunded" : "refund_pending";
    appointment.refund = existingRefund._id;
    appointment.refundId = existingRefund.stripeRefundId;
    appointment.refundedAmount = existingRefund.refundAmount;
    appointment.refundedAt = existingRefund.processedAt || existingRefund.updatedAt;
    return existingRefund;
  }

  const stripeClient = ensureStripe();
  const amount = Math.round(Number(appointment.amountPaid || 0) * 100);
  const stripeRefund = await stripeClient.refunds.create(
    {
      payment_intent: appointment.paymentIntentId,
      amount,
      reason: "requested_by_customer",
      metadata: {
        appointmentId: String(appointment._id),
        patientId: String(appointment.patient),
        doctorId: String(appointment.doctor),
        reason: "doctor_rejected_appointment"
      }
    },
    {
      idempotencyKey: `appointment-rejection-refund-${appointment._id}`
    }
  );

  const isCompleted = stripeRefund.status === "succeeded";
  const refund = await Refund.create({
    appointment: appointment._id,
    patient: appointment.patient,
    originalPaymentAmount: appointment.amountPaid,
    refundAmount: Number((amount / 100).toFixed(2)),
    refundReason: "doctor_rejected_appointment",
    refundReasonDetails: "Automatic refund because the doctor rejected the appointment.",
    refundMethod: "stripe",
    stripeRefundId: stripeRefund.id,
    stripePaymentIntentId: appointment.paymentIntentId,
    status: isCompleted ? "completed" : "processing",
    processedBy,
    processedAt: new Date().toISOString()
  });

  appointment.paymentStatus = isCompleted ? "refunded" : "refund_pending";
  appointment.refund = refund._id;
  appointment.refundId = stripeRefund.id;
  appointment.refundedAmount = refund.refundAmount;
  appointment.refundedAt = refund.processedAt;

  return refund;
};

const decorateSlot = (slot) => {
  if (!slot) {
    return slot;
  }

  const plainSlot = typeof slot.toObject === "function" ? slot.toObject() : slot;
  const maxPatients = plainSlot.maxPatients || 1;
  const bookedCount = plainSlot.bookedCount || 0;

  return {
    ...plainSlot,
    maxPatients,
    bookedCount,
    availableSpots: Math.max(maxPatients - bookedCount, 0),
    isBooked: bookedCount >= maxPatients
  };
};

const populateAppointmentById = async (appointmentId) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate("patient", "fullName email")
    .populate("doctor", "fullName email specialization avatar")
    .populate("availabilitySlot");

  if (appointment?.availabilitySlot) {
    appointment.availabilitySlot = decorateSlot(appointment.availabilitySlot);
  }

  return appointment;
};

const loadBookingContext = async ({ patientId, doctorId, appointmentDate, availabilityId }, userId, userRole) => {
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

  if (!patient.isActive) {
    throw new AppError("Patient account is deactivated", 403, "PATIENT_DEACTIVATED");
  }

  if (!doctor.isActive) {
    throw new AppError("Doctor account is deactivated", 403, "DOCTOR_DEACTIVATED");
  }

  if (userRole === ROLES.PATIENT && userId.toString() !== patientId) {
    throw new AppError("Patients can only book appointments for themselves", 403, "FORBIDDEN");
  }

  let slot = null;
  let resolvedAppointmentDate = appointmentDate;

  if (availabilityId) {
    slot = await DoctorAvailability.findById(availabilityId);

    if (!slot) {
      throw new AppError("Availability slot not found", 404, "SLOT_NOT_FOUND");
    }

    if (slot.doctor.toString() !== doctorId) {
      throw new AppError("Availability slot does not belong to this doctor", 400, "SLOT_DOCTOR_MISMATCH");
    }

    const maxPatients = slot.maxPatients || 1;
    const bookedCount = slot.bookedCount || 0;
    if (bookedCount >= maxPatients || slot.isBooked) {
      throw new AppError("Selected time slot is already full", 409, "SLOT_ALREADY_BOOKED");
    }

    resolvedAppointmentDate = new Date(`${slot.date}T${slot.startTime}:00`);
  }

  if (!resolvedAppointmentDate) {
    throw new AppError("Appointment date is required", 400, "VALIDATION_ERROR");
  }

  const amount = Number(slot?.price ?? doctor.consultationFee ?? 0);

  return {
    patient,
    doctor,
    slot,
    appointmentDate: resolvedAppointmentDate,
    amount: Number(amount.toFixed(2))
  };
};

export const createAppointmentCheckout = async (payload, userId, userRole) => {
  const stripeClient = ensureStripe();
  const context = await loadBookingContext(payload, userId, userRole);

  if (!context.slot) {
    throw new AppError("Stripe checkout requires a doctor availability slot", 400, "SLOT_REQUIRED");
  }

  if (context.amount <= 0) {
    throw new AppError("Selected slot must have a price greater than zero", 400, "INVALID_SLOT_PRICE");
  }

  const paymentIntent = await stripeClient.paymentIntents.create({
    amount: Math.round(context.amount * 100),
    currency: "usd",
    payment_method_types: ["card"],
    receipt_email: context.patient.email,
    metadata: {
      patientId: String(context.patient._id),
      doctorId: String(context.doctor._id),
      availabilityId: String(context.slot._id),
      appointmentDate: context.appointmentDate.toISOString()
    },
    description: `SmartCare appointment with ${context.doctor.fullName}`
  });

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    amount: context.amount,
    currency: paymentIntent.currency,
    doctor: {
      id: context.doctor._id,
      fullName: context.doctor.fullName,
      specialization: context.doctor.specialization,
      avatar: context.doctor.avatar
    },
    slot: {
      id: context.slot._id,
      date: context.slot.date,
      startTime: context.slot.startTime,
      endTime: context.slot.endTime,
      price: context.slot.price,
      maxPatients: context.slot.maxPatients || 1,
      bookedCount: context.slot.bookedCount || 0,
      availableSpots: Math.max((context.slot.maxPatients || 1) - (context.slot.bookedCount || 0), 0)
    }
  };
};

export const confirmAppointmentPayment = async ({ paymentIntentId, ...payload }, userId, userRole) => {
  const stripeClient = ensureStripe();
  const existingAppointment = await Appointment.findOne({ paymentIntentId });

  if (existingAppointment) {
    return populateAppointmentById(existingAppointment._id);
  }

  const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

  if (!paymentIntent) {
    throw new AppError("Stripe payment not found", 404, "PAYMENT_NOT_FOUND");
  }

  if (paymentIntent.status !== "succeeded") {
    throw new AppError("Payment has not been completed", 400, "PAYMENT_NOT_COMPLETED");
  }

  if (
    paymentIntent.metadata.patientId !== String(payload.patientId) ||
    paymentIntent.metadata.doctorId !== String(payload.doctorId) ||
    paymentIntent.metadata.availabilityId !== String(payload.availabilityId)
  ) {
    throw new AppError("Payment does not match the selected appointment", 400, "PAYMENT_MISMATCH");
  }

  const duplicateAppointment = await Appointment.findOne({
    patient: payload.patientId,
    availabilitySlot: payload.availabilityId,
    status: { $nin: [APPOINTMENT_STATUS.CANCELLED, APPOINTMENT_STATUS.REJECTED] }
  });

  if (duplicateAppointment) {
    duplicateAppointment.paymentIntentId = paymentIntentId;
    duplicateAppointment.paymentStatus = "paid";
    duplicateAppointment.amountPaid = Number(((paymentIntent.amount_received || paymentIntent.amount) / 100).toFixed(2));
    duplicateAppointment.paymentCurrency = paymentIntent.currency;
    await duplicateAppointment.save();
    return populateAppointmentById(duplicateAppointment._id);
  }

  return createAppointment(
    {
      patientId: payload.patientId,
      doctorId: payload.doctorId,
      availabilityId: payload.availabilityId
    },
    userId,
    userRole,
    {
      paymentIntentId,
      paymentStatus: "paid",
      amountPaid: Number(((paymentIntent.amount_received || paymentIntent.amount) / 100).toFixed(2)),
      paymentCurrency: paymentIntent.currency
    }
  );
};

export const createAppointment = async (
  { patientId, doctorId, appointmentDate, availabilityId },
  userId,
  userRole,
  paymentData = {}
) => {
  const context = await loadBookingContext({ patientId, doctorId, appointmentDate, availabilityId }, userId, userRole);

  if (paymentData.paymentIntentId) {
    const existingAppointment = await Appointment.findOne({ paymentIntentId: paymentData.paymentIntentId });
    if (existingAppointment) {
      return populateAppointmentById(existingAppointment._id);
    }
  }

  if (context.slot) {
    const duplicateAppointment = await Appointment.findOne({
      patient: patientId,
      availabilitySlot: context.slot._id,
      status: { $nin: [APPOINTMENT_STATUS.CANCELLED, APPOINTMENT_STATUS.REJECTED] }
    });

    if (duplicateAppointment) {
      throw new AppError("Patient already booked this slot", 409, "DUPLICATE_SLOT_BOOKING");
    }

    context.slot.bookedCount = (context.slot.bookedCount || 0) + 1;
    context.slot.isBooked = context.slot.bookedCount >= (context.slot.maxPatients || 1);
    await context.slot.save();
  }

  const appointment = await Appointment.create({
    patient: patientId,
    doctor: doctorId,
    availabilitySlot: context.slot?._id,
    appointmentDate: context.appointmentDate,
    status: APPOINTMENT_STATUS.PENDING,
    paymentStatus: paymentData.paymentStatus || "pending",
    paymentIntentId: paymentData.paymentIntentId,
    amountPaid: paymentData.amountPaid ?? 0,
    paymentCurrency: paymentData.paymentCurrency || "usd"
  });

  return populateAppointmentById(appointment._id);
};

export const getAppointmentById = async (appointmentId) => {
  const appointment = await populateAppointmentById(appointmentId);

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

  if (userRole === ROLES.PATIENT) {
    query.patient = userId;
  } else if (userRole === ROLES.DOCTOR) {
    query.doctor = userId;
  }

  if (status) {
    query.status = status;
  }

  const skip = (safePage - 1) * safeLimit;

  const [appointments, total] = await Promise.all([
    Appointment.find(query)
      .populate("patient", "fullName email")
      .populate("doctor", "fullName email specialization avatar")
      .populate("availabilitySlot")
      .sort({ [safeSortBy]: safeSortOrder })
      .skip(skip)
      .limit(safeLimit),
    Appointment.countDocuments(query)
  ]);

  return {
    appointments: appointments.map((appointment) => ({
      ...appointment.toObject(),
      availabilitySlot: decorateSlot(appointment.availabilitySlot)
    })),
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
      .populate("doctor", "fullName email specialization avatar")
      .populate("availabilitySlot")
      .sort({ [safeSortBy]: safeSortOrder })
      .skip(skip)
      .limit(safeLimit),
    Appointment.countDocuments(query)
  ]);

  return {
    appointments: appointments.map((appointment) => ({
      ...appointment.toObject(),
      availabilitySlot: decorateSlot(appointment.availabilitySlot)
    })),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1
    }
  };
};

export const getPatientUpcomingAppointments = async (patientId, requesterId, requesterRole) => {
  const isAdmin = [ROLES.ADMIN, ROLES.SYSTEM_ADMIN].includes(requesterRole);
  const isDoctorLike = [ROLES.DOCTOR, ROLES.NURSE].includes(requesterRole);
  const isSamePatient = requesterRole === ROLES.PATIENT && String(requesterId) === String(patientId);

  if (!isAdmin && !isDoctorLike && !isSamePatient) {
    throw new AppError("Not authorized to view this patient's upcoming appointments", 403, "FORBIDDEN");
  }

  const patient = await User.findById(patientId).select("_id");

  if (!patient) {
    throw new AppError("Patient not found", 404, "PATIENT_NOT_FOUND");
  }

  const now = new Date();

  const appointments = await Appointment.find({
    patient: patientId,
    appointmentDate: { $gte: now },
    status: { $in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.APPROVED] }
  })
    .populate("patient", "fullName email phone avatar")
    .populate("doctor", "fullName email specialization avatar")
    .populate("availabilitySlot")
    .sort({ appointmentDate: 1 })
    .limit(20);

  return appointments.map((appointment) => ({
    ...appointment.toObject(),
    availabilitySlot: decorateSlot(appointment.availabilitySlot)
  }));
};

export const updateAppointment = async (appointmentId, { appointmentDate, status }, userId, userRole) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");
  }

  const isPatient = userRole === ROLES.PATIENT && appointment.patient.toString() === userId.toString();
  const isDoctor = userRole === ROLES.DOCTOR && appointment.doctor.toString() === userId.toString();
  const isAdmin = [ROLES.ADMIN, ROLES.SYSTEM_ADMIN].includes(userRole);

  if (!isPatient && !isDoctor && !isAdmin) {
    throw new AppError("Not authorized to update this appointment", 403, "FORBIDDEN");
  }

  if (appointmentDate !== undefined) {
    if (!isDoctor && !isAdmin) {
      throw new AppError("Only doctors or admins can reschedule appointments", 403, "FORBIDDEN");
    }

    if (appointment.status === APPOINTMENT_STATUS.CANCELLED || appointment.status === APPOINTMENT_STATUS.COMPLETED) {
      throw new AppError("Only pending or approved appointments can be rescheduled", 400, "INVALID_STATUS_CHANGE");
    }

    appointment.appointmentDate = appointmentDate;
  }

  if (status !== undefined) {
    if (
      [APPOINTMENT_STATUS.CANCELLED, APPOINTMENT_STATUS.REJECTED].includes(appointment.status) &&
      status !== appointment.status
    ) {
      throw new AppError("Cancelled or rejected appointments cannot be changed", 400, "INVALID_STATUS_CHANGE");
    }

    if (appointment.status === APPOINTMENT_STATUS.COMPLETED && status !== APPOINTMENT_STATUS.COMPLETED) {
      throw new AppError("Completed appointments cannot be changed", 400, "INVALID_STATUS_CHANGE");
    }

    if (isPatient) {
      throw new AppError("Patients cannot directly change appointment status", 403, "FORBIDDEN");
    }

    if (isDoctor) {
      const allowedDoctorTransitions = {
        [APPOINTMENT_STATUS.PENDING]: [APPOINTMENT_STATUS.APPROVED, APPOINTMENT_STATUS.REJECTED],
        [APPOINTMENT_STATUS.APPROVED]: [APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.REJECTED],
        [APPOINTMENT_STATUS.REJECTED]: [],
        [APPOINTMENT_STATUS.COMPLETED]: [],
        [APPOINTMENT_STATUS.CANCELLED]: []
      };

      const allowedStatuses = allowedDoctorTransitions[appointment.status] || [];

      if (!allowedStatuses.includes(status) && status !== appointment.status) {
        throw new AppError("Doctors can only accept pending appointments or reject pending/approved appointments", 400, "INVALID_STATUS_CHANGE");
      }
    }

    if (
      status === APPOINTMENT_STATUS.REJECTED &&
      [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.APPROVED].includes(appointment.status)
    ) {
      await createStripeAppointmentRefund(appointment, userId);
      await releaseAppointmentSlotCapacity(appointment);
    }

    appointment.status = status;
  }

  await appointment.save();
  return populateAppointmentById(appointmentId);
};

export const cancelAppointment = async (appointmentId, userId, userRole) => {
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");
  }

  if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
    throw new AppError("Appointment is already cancelled", 400, "ALREADY_CANCELLED");
  }

  if (appointment.status === APPOINTMENT_STATUS.REJECTED) {
    throw new AppError("Rejected appointments cannot be cancelled", 400, "INVALID_STATUS_CHANGE");
  }

  if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
    throw new AppError("Cannot cancel a completed appointment", 400, "CANNOT_CANCEL_COMPLETED");
  }

  const isPatient = userRole === ROLES.PATIENT && appointment.patient.toString() === userId.toString();
  const isDoctor = userRole === ROLES.DOCTOR && appointment.doctor.toString() === userId.toString();
  const isAdmin = [ROLES.ADMIN, ROLES.SYSTEM_ADMIN].includes(userRole);

  if (!isPatient && !isDoctor && !isAdmin) {
    throw new AppError("Not authorized to cancel this appointment", 403, "FORBIDDEN");
  }

  appointment.status = APPOINTMENT_STATUS.CANCELLED;
  await appointment.save();

  await releaseAppointmentSlotCapacity(appointment);

  return populateAppointmentById(appointmentId);
};
