import "dotenv/config";
import bcrypt from "bcryptjs";
import prisma from "../src/config/prisma.js";

process.env.DATABASE_PROVIDER = "postgres";

const seedDate = "2026-05-10";
const appointmentDate = new Date(`${seedDate}T09:00:00.000Z`);
const availabilityDate = new Date(`${seedDate}T00:00:00.000Z`);

const upsertUser = async ({ email, fullName, role, password, ...rest }) => {
  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      role,
      passwordHash,
      ...rest
    },
    create: {
      email,
      fullName,
      role,
      passwordHash,
      ...rest
    }
  });
};

try {
  const admin = await upsertUser({
    email: "admin@smartcare.local",
    fullName: "SmartCare Admin",
    role: "admin",
    password: "Admin123!",
    phone: "0770000001"
  });

  const doctor = await upsertUser({
    email: "doctor@smartcare.local",
    fullName: "Dr. Jane Perera",
    role: "doctor",
    password: "Doctor123!",
    phone: "0770000002",
    specialization: "Cardiology",
    consultationFee: 75
  });

  const patient = await upsertUser({
    email: "patient@smartcare.local",
    fullName: "Kamal Silva",
    role: "patient",
    password: "Patient123!",
    phone: "0770000003"
  });

  let availabilitySlot = await prisma.doctorAvailability.findFirst({
    where: {
      doctorId: doctor.id,
      date: availabilityDate,
      startTime: "09:00"
    }
  });

  if (!availabilitySlot) {
    availabilitySlot = await prisma.doctorAvailability.create({
      data: {
        doctorId: doctor.id,
        date: availabilityDate,
        startTime: "09:00",
        endTime: "10:00",
        price: 75,
        maxPatients: 3,
        bookedCount: 0,
        isBooked: false
      }
    });
  }

  let appointment = await prisma.appointment.findFirst({
    where: {
      patientId: patient.id,
      doctorId: doctor.id,
      availabilitySlotId: availabilitySlot.id
    }
  });

  if (!appointment) {
    appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        availabilitySlotId: availabilitySlot.id,
        appointmentDate,
        status: "pending",
        paymentStatus: "pending",
        amountPaid: 0,
        paymentCurrency: "usd"
      }
    });

    const nextBookedCount = (availabilitySlot.bookedCount || 0) + 1;
    availabilitySlot = await prisma.doctorAvailability.update({
      where: { id: availabilitySlot.id },
      data: {
        bookedCount: nextBookedCount,
        isBooked: nextBookedCount >= (availabilitySlot.maxPatients || 1)
      }
    });
  }

  console.log("POSTGRES_SEED_OK");
  console.log(JSON.stringify({
    adminEmail: admin.email,
    doctorEmail: doctor.email,
    patientEmail: patient.email,
    availabilitySlotId: availabilitySlot.id,
    appointmentId: appointment.id
  }, null, 2));
} catch (error) {
  console.error("POSTGRES_SEED_FAIL");
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
