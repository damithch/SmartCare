import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import appointmentRoutes from "./appointment.routes.js";
import medicalRecordRoutes from "./medicalRecord.routes.js";
import medicineRoutes from "./medicine.routes.js";
import billRoutes from "./bill.routes.js";
import paymentRoutes from "./payment.routes.js";
import labRoutes from "./lab.routes.js";
import staffRoutes from "./staff.routes.js";
import doctorAvailabilityRoutes from "./doctorAvailability.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/medical-records", medicalRecordRoutes);
router.use("/medicines", medicineRoutes);
router.use("/bills", billRoutes);
router.use("/payments", paymentRoutes);
router.use("/lab", labRoutes);
router.use("/staff", staffRoutes);
router.use("/doctor-availability", doctorAvailabilityRoutes);

export default router;
