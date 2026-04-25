-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'doctor', 'patient', 'student', 'nurse', 'staff', 'receptionist', 'billing_staff', 'pharmacist', 'system_admin', 'hospital_manager');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('pending', 'approved', 'rejected', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "AppointmentPaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'patient',
    "phone" TEXT NOT NULL DEFAULT '',
    "student_id" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT '',
    "level" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "specialization" TEXT NOT NULL DEFAULT '',
    "consultation_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "avatar" TEXT NOT NULL DEFAULT '',
    "cover_image" TEXT NOT NULL DEFAULT '',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_availability" (
    "id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "max_patients" INTEGER NOT NULL DEFAULT 1,
    "booked_count" INTEGER NOT NULL DEFAULT 0,
    "is_booked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "availability_slot_id" UUID,
    "appointment_date" TIMESTAMP(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'pending',
    "payment_status" "AppointmentPaymentStatus" NOT NULL DEFAULT 'pending',
    "payment_intent_id" TEXT,
    "amount_paid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "payment_currency" TEXT NOT NULL DEFAULT 'usd',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "doctor_availability_doctor_date_idx" ON "doctor_availability"("doctor_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_availability_doctor_date_start_time_key" ON "doctor_availability"("doctor_id", "date", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_payment_intent_id_key" ON "appointments"("payment_intent_id");

-- CreateIndex
CREATE INDEX "appointments_patient_appointment_date_idx" ON "appointments"("patient_id", "appointment_date");

-- CreateIndex
CREATE INDEX "appointments_doctor_appointment_date_idx" ON "appointments"("doctor_id", "appointment_date");

-- CreateIndex
CREATE INDEX "appointments_status_appointment_date_idx" ON "appointments"("status", "appointment_date");

-- AddForeignKey
ALTER TABLE "doctor_availability" ADD CONSTRAINT "doctor_availability_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_availability_slot_id_fkey" FOREIGN KEY ("availability_slot_id") REFERENCES "doctor_availability"("id") ON DELETE SET NULL ON UPDATE CASCADE;
