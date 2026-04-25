import prisma from "../config/prisma.js";
import DoctorAvailability from "../models/doctorAvailability.model.js";
import AppError from "../utils/appError.js";

const isPostgresProvider = () => process.env.DATABASE_PROVIDER === "postgres";

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

const normalizeTime = (value) => {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    throw new AppError("Time must be in HH:MM format", 400, "INVALID_TIME");
  }

  return value;
};

const normalizePrice = (value) => {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    throw new AppError("Price must be a valid non-negative number", 400, "INVALID_PRICE");
  }

  return Number(parsedValue.toFixed(2));
};

const normalizeMaxPatients = (value) => {
  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new AppError("Person count must be a whole number of at least 1", 400, "INVALID_PERSON_COUNT");
  }

  return parsedValue;
};

const validateRange = (startTime, endTime) => {
  if (startTime >= endTime) {
    throw new AppError("End time must be after start time", 400, "INVALID_TIME_RANGE");
  }
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
    date: formatDateOnly(plainSlot.date),
    price: toNumber(plainSlot.price ?? 0),
    maxPatients,
    bookedCount,
    availableSpots: Math.max(maxPatients - bookedCount, 0),
    isBooked: bookedCount >= maxPatients
  };
};

export const listDoctorAvailability = async (doctorId, date) => {
  if (isPostgresProvider()) {
    const where = {
      doctorId
    };

    if (date) {
      where.date = new Date(`${date}T00:00:00.000Z`);
    }

    const slots = await prisma.doctorAvailability.findMany({
      where,
      orderBy: [{ date: "asc" }, { startTime: "asc" }]
    });

    return slots.map(decorateSlot);
  }

  const query = { doctor: doctorId };

  if (date) {
    query.date = date;
  }

  const slots = await DoctorAvailability.find(query).sort({ date: 1, startTime: 1 });
  return slots.map(decorateSlot);
};

export const listAvailabilityForDoctor = async (doctorId, date) => {
  if (isPostgresProvider()) {
    const slots = await prisma.doctorAvailability.findMany({
      where: {
        doctorId,
        date: new Date(`${date}T00:00:00.000Z`)
      },
      orderBy: { startTime: "asc" }
    });

    return slots
      .filter((slot) => (slot.bookedCount || 0) < (slot.maxPatients || 1))
      .map(decorateSlot);
  }

  const slots = await DoctorAvailability.find({
    doctor: doctorId,
    date,
    $expr: { $lt: ["$bookedCount", "$maxPatients"] }
  }).sort({ startTime: 1 });

  return slots.map(decorateSlot);
};

export const getAvailabilitySlotById = async (slotId) => {
  if (isPostgresProvider()) {
    const slot = await prisma.doctorAvailability.findUnique({
      where: { id: slotId }
    });

    return decorateSlot(slot);
  }

  return DoctorAvailability.findById(slotId);
};

export const createDoctorAvailability = async (doctorId, { date, startTime, endTime, price, maxPatients }) => {
  const normalizedStartTime = normalizeTime(startTime);
  const normalizedEndTime = normalizeTime(endTime);
  const normalizedPrice = normalizePrice(price);
  const normalizedMaxPatients = normalizeMaxPatients(maxPatients);
  validateRange(normalizedStartTime, normalizedEndTime);

  if (isPostgresProvider()) {
    const slotDate = new Date(`${date}T00:00:00.000Z`);

    const existingSlot = await prisma.doctorAvailability.findFirst({
      where: {
        doctorId,
        date: slotDate,
        startTime: { lt: normalizedEndTime },
        endTime: { gt: normalizedStartTime }
      }
    });

    if (existingSlot) {
      throw new AppError("This time overlaps with an existing slot", 409, "SLOT_OVERLAP");
    }

    const slot = await prisma.doctorAvailability.create({
      data: {
        doctorId,
        date: slotDate,
        startTime: normalizedStartTime,
        endTime: normalizedEndTime,
        price: normalizedPrice,
        maxPatients: normalizedMaxPatients,
        bookedCount: 0,
        isBooked: false
      }
    });

    return decorateSlot(slot);
  }

  const existingSlot = await DoctorAvailability.findOne({
    doctor: doctorId,
    date,
    $or: [
      {
        startTime: { $lt: normalizedEndTime },
        endTime: { $gt: normalizedStartTime }
      }
    ]
  });

  if (existingSlot) {
    throw new AppError("This time overlaps with an existing slot", 409, "SLOT_OVERLAP");
  }

  const slot = await DoctorAvailability.create({
    doctor: doctorId,
    date,
    startTime: normalizedStartTime,
    endTime: normalizedEndTime,
    price: normalizedPrice,
    maxPatients: normalizedMaxPatients,
    bookedCount: 0,
    isBooked: false
  });

  return decorateSlot(slot);
};

export const deleteDoctorAvailability = async (doctorId, slotId) => {
  if (isPostgresProvider()) {
    const slot = await prisma.doctorAvailability.findFirst({
      where: {
        id: slotId,
        doctorId
      }
    });

    if (!slot) {
      throw new AppError("Availability slot not found", 404, "SLOT_NOT_FOUND");
    }

    if ((slot.bookedCount || 0) > 0 || slot.isBooked) {
      throw new AppError("Booked slots cannot be deleted", 400, "BOOKED_SLOT");
    }

    await prisma.doctorAvailability.delete({
      where: { id: slotId }
    });

    return decorateSlot(slot);
  }

  const slot = await DoctorAvailability.findOne({ _id: slotId, doctor: doctorId });

  if (!slot) {
    throw new AppError("Availability slot not found", 404, "SLOT_NOT_FOUND");
  }

  if ((slot.bookedCount || 0) > 0 || slot.isBooked) {
    throw new AppError("Booked slots cannot be deleted", 400, "BOOKED_SLOT");
  }

  await slot.deleteOne();
  return decorateSlot(slot);
};
