import Stripe from "stripe";
import prisma, { getPrismaClient } from "../config/prisma.js";
import Appointment from "../models/appointment.model.js";
import User from "../models/user.model.js";
import DoctorAvailability from "../models/doctorAvailability.model.js";
import AppError from "../utils/appError.js";
import { ROLES } from "../constants/roles.js";

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

const isPostgresProvider = () => process.env.DATABASE_PROVIDER === "postgres";

const ensureStripe = () => {
  if (!stripe) {
    throw new AppError("Stripe is not configured on the server", 500, "STRIPE_NOT_CONFIGURED");
  }

  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    throw new AppError("Stripe publishable key is missing", 500, "STRIPE_NOT_CONFIGURED");
  }

  return stripe;
};

const formatDateOnly = (value) => {
  if (!value) return value;
  if (typeof value === "string") return value;
  return value.toISOString().slice(0, 10);
};

const toNumber = (value) => {
  if (typeof value === "number") return value;
  if (value == null) return value;
  return Number(value);
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
    _id: plainSlot._id ?? plainSlot.id,
    doctor: plainSlot.doctor ?? plainSlot.doctorId,
    date: formatDateOnly(plainSlot.date),
    price: toNumber(plainSlot.price ?? 0),
    maxPatients,
    bookedCount,
    availableSpots: Math.max(maxPatients - bookedCount, 0),
    isBooked: bookedCount >= maxPatients
  };
};

const decorateUser = (user) => {
  if (!user) return user;

  return {
    ...user,
    _id: user._id ?? user.id,
    consultationFee: toNumber(user.consultationFee ?? 0)
  };
};

const decorateAppointment = (appointment) => {
  if (!appointment) {
    return appointment;
  }

  const plainAppointment = typeof appointment.toObject === "function"
    ? appointment.toObject()
    : appointment;

  return {
    ...plainAppointment,
    _id: plainAppointment._id ?? plainAppointment.id,
    patient: decorateUser(plainAppointment.patient),
    doctor: decorateUser(plainAppointment.doctor),
    availabilitySlot: decorateSlot(plainAppointment.availabilitySlot),
    amountPaid: toNumber(plainAppointment.amountPaid ?? 0)
  };
};

const releaseAppointmentSlotCapacityMongo = async (appointment) => {
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

const releaseAppointmentSlotCapacityPostgres = async (transactionClient, availabilitySlotId) => {
  if (!availabilitySlotId) {
    return;
  }

  const slot = await transactionClient.doctorAvailability.findUnique({
    where: { id: availabilitySlotId }
  });

  if (!slot) {
    return;
  }

  const bookedCount = Math.max((slot.bookedCount || 0) - 1, 0);
  const maxPatients = slot.maxPatients || 1;

  await transactionClient.doctorAvailability.update({
    where: { id: availabilitySlotId },
    data: {
      bookedCount,
      isBooked: bookedCount >= maxPatients
    }
  });
};

const populateAppointmentByIdMongo = async (appointmentId) => {
  const appointment = await Appointment.findById(appointmentId)
    .populate("patient", "fullName email")
    .populate("doctor", "fullName email specialization avatar")
    .populate("availabilitySlot");

  return decorateAppointment(appointment);
};

const populateAppointmentByIdPostgres = async (appointmentId) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          specialization: true,
          avatar: true,
          consultationFee: true,
          role: true,
          isActive: true
        }
      },
      doctor: {
        select: {
          id: true,
          fullName: true,
          email: true,
          specialization: true,
          avatar: true,
          consultationFee: true,
          role: true,
          isActive: true
        }
      },
      availabilitySlot: true
    }
  });

  return decorateAppointment(appointment);
};

const populateAppointmentById = async (appointmentId) => {
  if (isPostgresProvider()) {
    return populateAppointmentByIdPostgres(appointmentId);
  }

  return populateAppointmentByIdMongo(appointmentId);
};

const loadBookingContextMongo = async ({ patientId, doctorId, appointmentDate, availabilityId }, userId, userRole) => {
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
    patient: decorateUser(patient),
    doctor: decorateUser(doctor),
    slot: decorateSlot(slot),
    appointmentDate: resolvedAppointmentDate,
    amount: Number(amount.toFixed(2))
  };
};

const loadBookingContextPostgres = async ({ patientId, doctorId, appointmentDate, availabilityId }, userId, userRole) => {
  const [patient, doctor] = await Promise.all([
    prisma.user.findUnique({ where: { id: patientId } }),
    prisma.user.findUnique({ where: { id: doctorId } })
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

  if (userRole === ROLES.PATIENT && String(userId) !== String(patientId)) {
    throw new AppError("Patients can only book appointments for themselves", 403, "FORBIDDEN");
  }

  let slot = null;
  let resolvedAppointmentDate = appointmentDate;

  if (availabilityId) {
    slot = await prisma.doctorAvailability.findUnique({
      where: { id: availabilityId }
    });

    if (!slot) {
      throw new AppError("Availability slot not found", 404, "SLOT_NOT_FOUND");
    }

    if (String(slot.doctorId) !== String(doctorId)) {
      throw new AppError("Availability slot does not belong to this doctor", 400, "SLOT_DOCTOR_MISMATCH");
    }

    const maxPatients = slot.maxPatients || 1;
    const bookedCount = slot.bookedCount || 0;
    if (bookedCount >= maxPatients || slot.isBooked) {
      throw new AppError("Selected time slot is already full", 409, "SLOT_ALREADY_BOOKED");
    }

    resolvedAppointmentDate = new Date(`${formatDateOnly(slot.date)}T${slot.startTime}:00`);
  }

  if (!resolvedAppointmentDate) {
    throw new AppError("Appointment date is required", 400, "VALIDATION_ERROR");
  }

  const amount = Number(slot?.price ?? doctor.consultationFee ?? 0);

  return {
    patient: decorateUser(patient),
    doctor: decorateUser(doctor),
    slot: decorateSlot(slot),
    appointmentDate: resolvedAppointmentDate,
    amount: Number(amount.toFixed(2))
  };
};

const loadBookingContext = async (payload, userId, userRole) => {
  if (isPostgresProvider()) {
    return loadBookingContextPostgres(payload, userId, userRole);
  }

  return loadBookingContextMongo(payload, userId, userRole);
};

const listAppointmentsPostgres = async (where, safeSortBy, safeSortOrder, skip, take) => {
  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatar: true
          }
        },
        doctor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            specialization: true,
            avatar: true
          }
        },
        availabilitySlot: true
      },
      orderBy: { [safeSortBy]: safeSortOrder === -1 ? "desc" : "asc" },
      skip,
      take
    }),
    prisma.appointment.count({ where })
  ]);

  return {
    appointments: appointments.map(decorateAppointment),
    total
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
    automatic_payment_methods: {
      enabled: true
    },
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
  const existingAppointment = isPostgresProvider()
    ? await prisma.appointment.findUnique({ where: { paymentIntentId } })
    : await Appointment.findOne({ paymentIntentId });

  if (existingAppointment) {
    return populateAppointmentById(existingAppointment._id ?? existingAppointment.id);
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

  if (isPostgresProvider()) {
    if (paymentData.paymentIntentId) {
      const existingAppointment = await prisma.appointment.findUnique({
        where: { paymentIntentId: paymentData.paymentIntentId }
      });

      if (existingAppointment) {
        return populateAppointmentById(existingAppointment.id);
      }
    }

    const client = await getPrismaClient();
    const appointmentId = await client.$transaction(async (tx) => {
      if (context.slot) {
        const duplicateAppointment = await tx.appointment.findFirst({
          where: {
            patientId,
            availabilitySlotId: context.slot._id,
            status: {
              notIn: [APPOINTMENT_STATUS.CANCELLED, APPOINTMENT_STATUS.REJECTED]
            }
          }
        });

        if (duplicateAppointment) {
          throw new AppError("Patient already booked this slot", 409, "DUPLICATE_SLOT_BOOKING");
        }

        const currentSlot = await tx.doctorAvailability.findUnique({
          where: { id: context.slot._id }
        });

        if (!currentSlot) {
          throw new AppError("Availability slot not found", 404, "SLOT_NOT_FOUND");
        }

        const bookedCount = (currentSlot.bookedCount || 0) + 1;
        const maxPatients = currentSlot.maxPatients || 1;

        if (bookedCount > maxPatients) {
          throw new AppError("Selected time slot is already full", 409, "SLOT_ALREADY_BOOKED");
        }

        await tx.doctorAvailability.update({
          where: { id: currentSlot.id },
          data: {
            bookedCount,
            isBooked: bookedCount >= maxPatients
          }
        });
      }

      const appointment = await tx.appointment.create({
        data: {
          patientId,
          doctorId,
          availabilitySlotId: context.slot?._id,
          appointmentDate: context.appointmentDate,
          status: APPOINTMENT_STATUS.PENDING,
          paymentStatus: paymentData.paymentStatus || "pending",
          paymentIntentId: paymentData.paymentIntentId,
          amountPaid: paymentData.amountPaid ?? 0,
          paymentCurrency: paymentData.paymentCurrency || "usd"
        }
      });

      return appointment.id;
    });

    return populateAppointmentById(appointmentId);
  }

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

    const rawSlot = await DoctorAvailability.findById(context.slot._id);
    rawSlot.bookedCount = (rawSlot.bookedCount || 0) + 1;
    rawSlot.isBooked = rawSlot.bookedCount >= (rawSlot.maxPatients || 1);
    await rawSlot.save();
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
  const skip = (safePage - 1) * safeLimit;

  if (isPostgresProvider()) {
    const where = {};

    if (userRole === ROLES.PATIENT) {
      where.patientId = userId;
    } else if (userRole === ROLES.DOCTOR) {
      where.doctorId = userId;
    }

    if (status) {
      where.status = status;
    }

    const { appointments, total } = await listAppointmentsPostgres(where, safeSortBy, safeSortOrder, skip, safeLimit);

    return {
      appointments,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1
      }
    };
  }

  const query = {};

  if (userRole === ROLES.PATIENT) {
    query.patient = userId;
  } else if (userRole === ROLES.DOCTOR) {
    query.doctor = userId;
  }

  if (status) {
    query.status = status;
  }

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
    appointments: appointments.map(decorateAppointment),
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
  const skip = (safePage - 1) * safeLimit;

  if (isPostgresProvider()) {
    const where = {};

    if (status) where.status = status;
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;

    const { appointments, total } = await listAppointmentsPostgres(where, safeSortBy, safeSortOrder, skip, safeLimit);

    return {
      appointments,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1
      }
    };
  }

  const query = {};

  if (status) query.status = status;
  if (doctorId) query.doctor = doctorId;
  if (patientId) query.patient = patientId;

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
    appointments: appointments.map(decorateAppointment),
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

  if (isPostgresProvider()) {
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
      select: { id: true }
    });

    if (!patient) {
      throw new AppError("Patient not found", 404, "PATIENT_NOT_FOUND");
    }

    const now = new Date();

    const appointments = await prisma.appointment.findMany({
      where: {
        patientId,
        appointmentDate: { gte: now },
        status: { in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.APPROVED] }
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatar: true
          }
        },
        doctor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            specialization: true,
            avatar: true
          }
        },
        availabilitySlot: true
      },
      orderBy: { appointmentDate: "asc" },
      take: 20
    });

    return appointments.map(decorateAppointment);
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

  return appointments.map(decorateAppointment);
};

export const updateAppointment = async (appointmentId, { appointmentDate, status }, userId, userRole) => {
  if (isPostgresProvider()) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");
    }

    const isPatient = userRole === ROLES.PATIENT && String(appointment.patientId) === String(userId);
    const isDoctor = userRole === ROLES.DOCTOR && String(appointment.doctorId) === String(userId);
    const isAdmin = [ROLES.ADMIN, ROLES.SYSTEM_ADMIN].includes(userRole);

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new AppError("Not authorized to update this appointment", 403, "FORBIDDEN");
    }

    const nextData = {};

    if (appointmentDate !== undefined) {
      if (!isDoctor && !isAdmin) {
        throw new AppError("Only doctors or admins can reschedule appointments", 403, "FORBIDDEN");
      }

      if (appointment.status === APPOINTMENT_STATUS.CANCELLED || appointment.status === APPOINTMENT_STATUS.COMPLETED) {
        throw new AppError("Only pending or approved appointments can be rescheduled", 400, "INVALID_STATUS_CHANGE");
      }

      nextData.appointmentDate = appointmentDate;
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

      nextData.status = status;
    }

    const client = await getPrismaClient();

    if (
      status === APPOINTMENT_STATUS.REJECTED &&
      [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.APPROVED].includes(appointment.status)
    ) {
      await client.$transaction(async (tx) => {
        await tx.appointment.update({
          where: { id: appointmentId },
          data: nextData
        });

        await releaseAppointmentSlotCapacityPostgres(tx, appointment.availabilitySlotId);
      });
    } else {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: nextData
      });
    }

    return populateAppointmentById(appointmentId);
  }

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
      await releaseAppointmentSlotCapacityMongo(appointment);
    }

    appointment.status = status;
  }

  await appointment.save();
  return populateAppointmentById(appointmentId);
};

export const cancelAppointment = async (appointmentId, userId, userRole) => {
  if (isPostgresProvider()) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

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

    const isPatient = userRole === ROLES.PATIENT && String(appointment.patientId) === String(userId);
    const isDoctor = userRole === ROLES.DOCTOR && String(appointment.doctorId) === String(userId);
    const isAdmin = [ROLES.ADMIN, ROLES.SYSTEM_ADMIN].includes(userRole);

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new AppError("Not authorized to cancel this appointment", 403, "FORBIDDEN");
    }

    const client = await getPrismaClient();
    await client.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: APPOINTMENT_STATUS.CANCELLED }
      });

      await releaseAppointmentSlotCapacityPostgres(tx, appointment.availabilitySlotId);
    });

    return populateAppointmentById(appointmentId);
  }

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

  await releaseAppointmentSlotCapacityMongo(appointment);

  return populateAppointmentById(appointmentId);
};
