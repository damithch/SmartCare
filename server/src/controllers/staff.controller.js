import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import * as staffService from "../services/staff.service.js";

// ========================
// STAFF CONTROLLERS
// ========================

export const addStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.addStaff(req.body, req.user.id);

  res.status(201).json({
    success: true,
    message: "Staff added successfully",
    data: staff,
  });
});

export const getStaffById = asyncHandler(async (req, res) => {
  const staff = await staffService.getStaffById(req.params.id);

  res.status(200).json({
    success: true,
    data: staff,
  });
});

export const getAllStaff = asyncHandler(async (req, res) => {
  const { staff, pagination } = await staffService.getAllStaff(req.query, req.user.id);

  res.status(200).json({
    success: true,
    data: staff,
    pagination,
  });
});

export const updateStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.updateStaff(req.params.id, req.body, req.user.id);

  res.status(200).json({
    success: true,
    message: "Staff updated successfully",
    data: staff,
  });
});

export const deleteStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.deleteStaff(req.params.id);

  res.status(200).json({
    success: true,
    message: "Staff deleted successfully",
    data: staff,
  });
});

export const getStaffByDepartment = asyncHandler(async (req, res) => {
  const { department } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const { staff, pagination } = await staffService.searchStaffByDepartment(
    department,
    parseInt(page),
    parseInt(limit)
  );

  res.status(200).json({
    success: true,
    data: staff,
    pagination,
  });
});

export const getStaffDirectory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const { staff, pagination } = await staffService.getStaffDirectory(
    parseInt(page),
    parseInt(limit)
  );

  res.status(200).json({
    success: true,
    data: staff,
    pagination,
  });
});

export const getStaffStatistics = asyncHandler(async (req, res) => {
  const stats = await staffService.getStaffStatistics();

  res.status(200).json({
    success: true,
    data: stats,
  });
});

// ========================
// SCHEDULE CONTROLLERS
// ========================

export const addSchedule = asyncHandler(async (req, res) => {
  const schedule = await staffService.addSchedule(req.body, req.user.id);

  res.status(201).json({
    success: true,
    message: "Schedule added successfully",
    data: schedule,
  });
});

export const getSchedulesByStaff = asyncHandler(async (req, res) => {
  const { staffId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const { schedules, pagination } = await staffService.getSchedulesByStaff(
    staffId,
    parseInt(page),
    parseInt(limit)
  );

  res.status(200).json({
    success: true,
    data: schedules,
    pagination,
  });
});

export const getAllSchedules = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const { schedules, pagination } = await staffService.getAllSchedules(
    req.query,
    parseInt(page),
    parseInt(limit)
  );

  res.status(200).json({
    success: true,
    data: schedules,
    pagination,
  });
});

export const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await staffService.updateSchedule(req.params.id, req.body);

  res.status(200).json({
    success: true,
    message: "Schedule updated successfully",
    data: schedule,
  });
});

export const deleteSchedule = asyncHandler(async (req, res) => {
  const schedule = await staffService.deleteSchedule(req.params.id);

  res.status(200).json({
    success: true,
    message: "Schedule archived successfully",
    data: schedule,
  });
});

// ========================
// ATTENDANCE CONTROLLERS
// ========================

export const checkIn = asyncHandler(async (req, res) => {
  const { staffId } = req.params;
  const { notes } = req.body;

  const attendance = await staffService.checkIn(staffId, notes, req.user.id);

  res.status(200).json({
    success: true,
    message: "Checked in successfully",
    data: attendance,
  });
});

export const checkOut = asyncHandler(async (req, res) => {
  const { staffId } = req.params;

  const attendance = await staffService.checkOut(staffId);

  res.status(200).json({
    success: true,
    message: "Checked out successfully",
    data: attendance,
  });
});

export const getAttendanceRecords = asyncHandler(async (req, res) => {
  const { records, pagination } = await staffService.getAttendanceRecords(req.query);

  res.status(200).json({
    success: true,
    data: records,
    pagination,
  });
});

export const getAttendanceSummary = asyncHandler(async (req, res) => {
  const { staffId } = req.params;
  const { year, month } = req.query;

  if (!year || !month) {
    throw new AppError("Year and month are required", 400);
  }

  const summary = await staffService.getAttendanceSummary(
    staffId,
    parseInt(year),
    parseInt(month)
  );

  res.status(200).json({
    success: true,
    data: summary,
  });
});

// ========================
// LEAVE CONTROLLERS
// ========================

export const requestLeave = asyncHandler(async (req, res) => {
  const leave = await staffService.requestLeave(req.body, req.user.id);

  res.status(201).json({
    success: true,
    message: "Leave request submitted successfully",
    data: leave,
  });
});

export const getLeaveRequests = asyncHandler(async (req, res) => {
  const { leaves, pagination } = await staffService.getLeaveRequests(req.query);

  res.status(200).json({
    success: true,
    data: leaves,
    pagination,
  });
});

export const approveLeave = asyncHandler(async (req, res) => {
  const { leaveId } = req.params;
  const { status, rejectionReason, comments } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    throw new AppError("Invalid status. Must be 'approved' or 'rejected'", 400);
  }

  if (status === "rejected" && !rejectionReason) {
    throw new AppError("Rejection reason is required", 400);
  }

  const leave = await staffService.approveLeave(
    leaveId,
    status,
    req.user.id,
    rejectionReason,
    comments
  );

  res.status(200).json({
    success: true,
    message: `Leave request ${status} successfully`,
    data: leave,
  });
});

export const cancelLeave = asyncHandler(async (req, res) => {
  const { leaveId } = req.params;

  const leave = await staffService.cancelLeave(leaveId, req.user.id);

  res.status(200).json({
    success: true,
    message: "Leave request cancelled successfully",
    data: leave,
  });
});

export const getUnresolvedLeaveRequests = asyncHandler(async (req, res) => {
  const leaves = await staffService.getUnresolvedLeaveRequests();

  res.status(200).json({
    success: true,
    data: leaves,
  });
});

// ========================
// PERFORMANCE CONTROLLERS
// ========================

export const addPerformanceReview = asyncHandler(async (req, res) => {
  const performance = await staffService.addPerformanceReview(req.body, req.user.id);

  res.status(201).json({
    success: true,
    message: "Performance review added successfully",
    data: performance,
  });
});

export const getPerformanceReviews = asyncHandler(async (req, res) => {
  const { reviews, pagination } = await staffService.getPerformanceReviews(req.query);

  res.status(200).json({
    success: true,
    data: reviews,
    pagination,
  });
});

export const addPatientRating = asyncHandler(async (req, res) => {
  const { performanceId } = req.params;

  const performance = await staffService.addPatientRating(
    performanceId,
    req.body,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: "Patient rating added successfully",
    data: performance,
  });
});

export const updatePerformanceReview = asyncHandler(async (req, res) => {
  const { performanceId } = req.params;

  const performance = await staffService.updatePerformanceReview(
    performanceId,
    req.body,
    req.user.id
  );

  res.status(200).json({
    success: true,
    message: "Performance review updated successfully",
    data: performance,
  });
});

export const getTopPerformers = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const topPerformers = await staffService.getStaffTopPerformers(parseInt(limit));

  res.status(200).json({
    success: true,
    data: topPerformers,
  });
});
