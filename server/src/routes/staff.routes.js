import express from "express";
import * as staffController from "../controllers/staff.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  addStaffSchema,
  updateStaffSchema,
  addScheduleSchema,
  updateScheduleSchema,
  attendanceCheckInSchema,
  updateAttendanceSchema,
  requestLeaveSchema,
  approveLeaveSchema,
  addPerformanceSchema,
  updatePerformanceSchema,
  addPatientRatingSchema,
  filterStaffSchema,
  filterScheduleSchema,
  filterAttendanceSchema,
  filterLeaveSchema,
  filterPerformanceSchema,
} from "../validators/staff.validation.js";

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

// ========================
// STAFF ROUTES
// ========================

// POST: Add new staff (admin only)
router.post(
  "/",
  authorize("admin", "system_admin", "hospital_manager"),
  validate(addStaffSchema),
  staffController.addStaff
);

// GET: Get all staff with filters
router.get(
  "/",
  authorize("admin", "doctor", "hospital_manager", "system_admin"),
  validate(filterStaffSchema),
  staffController.getAllStaff
);

// GET: Get staff directory
router.get(
  "/directory/list",
  staffController.getStaffDirectory
);

// GET: Get staff statistics
router.get(
  "/stats/overview",
  authorize("admin", "hospital_manager"),
  staffController.getStaffStatistics
);

// GET: Get staff by department
router.get(
  "/department/:department",
  authorize("admin", "doctor", "hospital_manager"),
  staffController.getStaffByDepartment
);

// GET: Get staff by ID
router.get(
  "/:id",
  staffController.getStaffById
);

// PATCH: Update staff
router.patch(
  "/:id",
  authorize("admin", "system_admin", "hospital_manager"),
  validate(updateStaffSchema),
  staffController.updateStaff
);

// DELETE: Delete staff (soft delete)
router.delete(
  "/:id",
  authorize("admin", "system_admin"),
  staffController.deleteStaff
);

// ========================
// SCHEDULE ROUTES
// ========================

// POST: Add schedule
router.post(
  "/:staffId/schedule",
  authorize("admin", "hospital_manager", "system_admin"),
  validate(addScheduleSchema),
  staffController.addSchedule
);

// GET: Get schedules for a staff
router.get(
  "/:staffId/schedule",
  authorize("admin", "doctor", "hospital_manager"),
  staffController.getSchedulesByStaff
);

// GET: Get all schedules with filters
router.get(
  "/schedule/list/all",
  authorize("admin", "hospital_manager"),
  validate(filterScheduleSchema),
  staffController.getAllSchedules
);

// PATCH: Update schedule
router.patch(
  "/schedule/:id",
  authorize("admin", "hospital_manager"),
  validate(updateScheduleSchema),
  staffController.updateSchedule
);

// DELETE: Delete schedule
router.delete(
  "/schedule/:id",
  authorize("admin", "hospital_manager"),
  staffController.deleteSchedule
);

// ========================
// ATTENDANCE ROUTES
// ========================

// POST: Check-in
router.post(
  "/:staffId/attendance/check-in",
  validate(attendanceCheckInSchema),
  staffController.checkIn
);

// POST: Check-out
router.post(
  "/:staffId/attendance/check-out",
  staffController.checkOut
);

// GET: Get attendance records
router.get(
  "/attendance/records/list",
  authorize("admin", "hospital_manager"),
  validate(filterAttendanceSchema),
  staffController.getAttendanceRecords
);

// GET: Get attendance summary for specific month
router.get(
  "/:staffId/attendance/summary",
  staffController.getAttendanceSummary
);

// ========================
// LEAVE ROUTES
// ========================

// POST: Request leave
router.post(
  "/leave/request",
  validate(requestLeaveSchema),
  staffController.requestLeave
);

// GET: Get leave requests
router.get(
  "/leave/requests/list",
  validate(filterLeaveSchema),
  staffController.getLeaveRequests
);

// GET: Get unresolved leave requests
router.get(
  "/leave/pending/list",
  authorize("admin", "hospital_manager"),
  staffController.getUnresolvedLeaveRequests
);

// PATCH: Approve/reject leave
router.patch(
  "/leave/:leaveId/approve",
  authorize("admin", "hospital_manager"),
  validate(approveLeaveSchema),
  staffController.approveLeave
);

// DELETE: Cancel leave
router.delete(
  "/leave/:leaveId/cancel",
  staffController.cancelLeave
);

// ========================
// PERFORMANCE ROUTES
// ========================

// POST: Add performance review
router.post(
  "/performance/review",
  authorize("admin", "hospital_manager"),
  validate(addPerformanceSchema),
  staffController.addPerformanceReview
);

// GET: Get performance reviews
router.get(
  "/performance/reviews/list",
  authorize("admin", "doctor", "hospital_manager"),
  validate(filterPerformanceSchema),
  staffController.getPerformanceReviews
);

// PATCH: Update performance review
router.patch(
  "/performance/:performanceId/update",
  authorize("admin", "hospital_manager"),
  validate(updatePerformanceSchema),
  staffController.updatePerformanceReview
);

// POST: Add patient rating
router.post(
  "/performance/:performanceId/rating",
  validate(addPatientRatingSchema),
  staffController.addPatientRating
);

// GET: Get top performers
router.get(
  "/performance/top/performers",
  authorize("admin", "hospital_manager"),
  staffController.getTopPerformers
);

export default router;
