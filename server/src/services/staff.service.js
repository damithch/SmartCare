import {
  StaffModel,
  ScheduleModel,
  AttendanceModel,
  LeaveModel,
  PerformanceModel,
} from "../models/staff.model.js";
import AppError from "../utils/appError.js";

// ========================
// STAFF FUNCTIONS
// ========================

export const addStaff = async (staffData, userId) => {
  const existingStaff = await StaffModel.findOne({ email: staffData.email });
  if (existingStaff) {
    throw new AppError("Staff with this email already exists", 400);
  }

  const staff = await StaffModel.create({
    ...staffData,
    addedBy: userId,
  });

  return staff;
};

export const getStaffById = async (staffId) => {
  const staff = await StaffModel.findById(staffId)
    .populate("addedBy", "firstName lastName email")
    .populate("lastUpdatedBy", "firstName lastName email");

  if (!staff || !staff.isActive) {
    throw new AppError("Staff not found", 404);
  }

  return staff;
};

export const getAllStaff = async (filters, userId) => {
  const {
    department,
    position,
    status,
    search,
    specialization,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;

  const query = { isActive: true };

  if (department) query.department = department;
  if (position) query.position = position;
  if (status) query.status = status;
  if (specialization) query.specializations = specialization;

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const sortObj = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [staff, total] = await Promise.all([
    StaffModel.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate("addedBy", "firstName lastName"),
    StaffModel.countDocuments(query),
  ]);

  return {
    staff,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

export const updateStaff = async (staffId, updateData, userId) => {
  // Prevent email changes
  if (updateData.email) {
    const existingStaff = await StaffModel.findOne({
      email: updateData.email,
      _id: { $ne: staffId },
    });
    if (existingStaff) {
      throw new AppError("Email already in use", 400);
    }
  }

  const staff = await StaffModel.findByIdAndUpdate(
    staffId,
    { ...updateData, lastUpdatedBy: userId },
    { new: true, runValidators: true }
  );

  if (!staff) {
    throw new AppError("Staff not found", 404);
  }

  return staff;
};

export const deleteStaff = async (staffId) => {
  const staff = await StaffModel.findByIdAndUpdate(
    staffId,
    { isActive: false, status: "inactive" },
    { new: true }
  );

  if (!staff) {
    throw new AppError("Staff not found", 404);
  }

  return staff;
};

export const searchStaffByDepartment = async (department, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [staff, total] = await Promise.all([
    StaffModel.find({ department, isActive: true })
      .sort({ firstName: 1 })
      .skip(skip)
      .limit(limit),
    StaffModel.countDocuments({ department, isActive: true }),
  ]);

  return {
    staff,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

// ========================
// SCHEDULE FUNCTIONS
// ========================

export const addSchedule = async (scheduleData, userId) => {
  // Verify staff exists
  const staff = await StaffModel.findById(scheduleData.staffId);
  if (!staff) {
    throw new AppError("Staff not found", 404);
  }

  const schedule = await ScheduleModel.create({
    ...scheduleData,
    addedBy: userId,
  });

  return schedule.populate("staffId", "firstName lastName email");
};

export const getSchedulesByStaff = async (staffId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [schedules, total] = await Promise.all([
    ScheduleModel.find({ staffId, status: "active" })
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit)
      .populate("staffId", "firstName lastName"),
    ScheduleModel.countDocuments({ staffId, status: "active" }),
  ]);

  return {
    schedules,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

export const getAllSchedules = async (filters, page = 1, limit = 10) => {
  const { staffId, shiftType, status = "active" } = filters;
  const query = { status };

  if (staffId) query.staffId = staffId;
  if (shiftType) query.shiftType = shiftType;

  const skip = (page - 1) * limit;

  const [schedules, total] = await Promise.all([
    ScheduleModel.find(query)
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit)
      .populate("staffId", "firstName lastName department"),
    ScheduleModel.countDocuments(query),
  ]);

  return {
    schedules,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

export const updateSchedule = async (scheduleId, updateData) => {
  const schedule = await ScheduleModel.findByIdAndUpdate(scheduleId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!schedule) {
    throw new AppError("Schedule not found", 404);
  }

  return schedule.populate("staffId", "firstName lastName");
};

export const deleteSchedule = async (scheduleId) => {
  const schedule = await ScheduleModel.findByIdAndUpdate(
    scheduleId,
    { status: "inactive" },
    { new: true }
  );

  if (!schedule) {
    throw new AppError("Schedule not found", 404);
  }

  return schedule;
};

// ========================
// ATTENDANCE FUNCTIONS
// ========================

export const checkIn = async (staffId, notes, userId) => {
  const staff = await StaffModel.findById(staffId);
  if (!staff) {
    throw new AppError("Staff not found", 404);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if already checked in today
  const existingAttendance = await AttendanceModel.findOne({
    staffId,
    date: { $gte: today },
  });

  if (existingAttendance && existingAttendance.checkInTime) {
    throw new AppError("Staff already checked in today", 400);
  }

  const attendance = await AttendanceModel.findOneAndUpdate(
    { staffId, date: { $gte: today } },
    {
      staffId,
      date: today,
      checkInTime: new Date(),
      status: "present",
      notes,
    },
    { new: true, upsert: true }
  );

  return attendance;
};

export const checkOut = async (staffId) => {
  const staff = await StaffModel.findById(staffId);
  if (!staff) {
    throw new AppError("Staff not found", 404);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await AttendanceModel.findOne({
    staffId,
    date: { $gte: today },
  });

  if (!attendance) {
    throw new AppError("No check-in record found for today", 404);
  }

  if (attendance.checkOutTime) {
    throw new AppError("Staff already checked out today", 400);
  }

  const checkOutTime = new Date();
  const hoursWorked = (checkOutTime - attendance.checkInTime) / (1000 * 60); // In minutes

  attendance.checkOutTime = checkOutTime;
  attendance.hoursWorked = hoursWorked;
  await attendance.save();

  return attendance;
};

export const getAttendanceRecords = async (filters) => {
  const {
    staffId,
    status,
    startDate,
    endDate,
    page = 1,
    limit = 10,
    sortBy = "date",
    sortOrder = "desc",
  } = filters;

  const query = { isActive: true };

  if (staffId) query.staffId = staffId;
  if (status) query.status = status;

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
  }

  const skip = (page - 1) * limit;
  const sortObj = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [records, total] = await Promise.all([
    AttendanceModel.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate("staffId", "firstName lastName"),
    AttendanceModel.countDocuments(query),
  ]);

  return {
    records,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

export const getAttendanceSummary = async (staffId, year, month) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const records = await AttendanceModel.find({
    staffId,
    date: { $gte: startDate, $lte: endDate },
  });

  const summary = {
    totalDays: endDate.getDate(),
    present: records.filter((r) => r.status === "present").length,
    absent: records.filter((r) => r.status === "absent").length,
    halfDay: records.filter((r) => r.status === "half_day").length,
    onLeave: records.filter((r) => r.status === "on_leave").length,
    late: records.filter((r) => r.status === "late").length,
    totalHoursWorked: records.reduce((sum, r) => sum + r.hoursWorked, 0),
  };

  return summary;
};

// ========================
// LEAVE FUNCTIONS
// ========================

export const requestLeave = async (leaveData, userId) => {
  const staff = await StaffModel.findById(leaveData.staffId);
  if (!staff) {
    throw new AppError("Staff not found", 404);
  }

  const leave = await LeaveModel.create({
    ...leaveData,
  });

  return leave.populate("staffId", "firstName lastName email");
};

export const getLeaveRequests = async (filters) => {
  const {
    staffId,
    leaveType,
    status = "pending",
    startDate,
    endDate,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;

  const query = { isActive: true };

  if (staffId) query.staffId = staffId;
  if (leaveType) query.leaveType = leaveType;
  if (status) query.status = status;

  if (startDate || endDate) {
    query.$or = [];
    if (startDate) {
      query.$or.push({ startDate: { $gte: new Date(startDate) } });
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.$or.push({ endDate: { $lte: end } });
    }
  }

  const skip = (page - 1) * limit;
  const sortObj = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [leaves, total] = await Promise.all([
    LeaveModel.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate("staffId", "firstName lastName email")
      .populate("approvedBy", "firstName lastName"),
    LeaveModel.countDocuments(query),
  ]);

  return {
    leaves,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

export const approveLeave = async (leaveId, status, userId, rejectionReason, comments) => {
  const leave = await LeaveModel.findById(leaveId);
  if (!leave) {
    throw new AppError("Leave request not found", 404);
  }

  if (leave.status !== "pending") {
    throw new AppError("Leave request has already been processed", 400);
  }

  leave.status = status;
  leave.approvedBy = userId;
  leave.approvalDate = new Date();

  if (status === "rejected") {
    leave.rejectionReason = rejectionReason;
  }

  if (comments) {
    leave.comments = comments;
  }

  await leave.save();

  // If approved, mark attendance as on_leave
  if (status === "approved") {
    const startDate = new Date(leave.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(leave.endDate);
    endDate.setHours(23, 59, 59, 999);

    await AttendanceModel.updateMany(
      {
        staffId: leave.staffId,
        date: { $gte: startDate, $lte: endDate },
      },
      { status: "on_leave" }
    );
  }

  return leave.populate("staffId", "firstName lastName").populate("approvedBy", "firstName lastName");
};

export const cancelLeave = async (leaveId, userId) => {
  const leave = await LeaveModel.findByIdAndUpdate(
    leaveId,
    { status: "cancelled", isActive: false },
    { new: true }
  );

  if (!leave) {
    throw new AppError("Leave request not found", 404);
  }

  return leave;
};

// ========================
// PERFORMANCE FUNCTIONS
// ========================

export const addPerformanceReview = async (performanceData, userId) => {
  const staff = await StaffModel.findById(performanceData.staffId);
  if (!staff) {
    throw new AppError("Staff not found", 404);
  }

  // Check if performance record already exists for this month/year
  const existingPerformance = await PerformanceModel.findOne({
    staffId: performanceData.staffId,
    year: performanceData.year,
    month: performanceData.month,
  });

  if (existingPerformance) {
    throw new AppError("Performance review already exists for this period", 400);
  }

  // Calculate completion rate
  const completionRate =
    performanceData.tasksAssigned > 0
      ? (performanceData.tasksCompleted / performanceData.tasksAssigned) * 100
      : 0;

  const performance = await PerformanceModel.create({
    ...performanceData,
    completionRate,
    reviewedBy: userId,
    reviewDate: new Date(),
  });

  return performance.populate("staffId", "firstName lastName");
};

export const getPerformanceReviews = async (filters) => {
  const {
    staffId,
    year,
    month,
    minRating,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;

  const query = { isActive: true };

  if (staffId) query.staffId = staffId;
  if (year) query.year = year;
  if (month) query.month = month;
  if (minRating) query.averageRating = { $gte: minRating };

  const skip = (page - 1) * limit;
  const sortObj = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const [reviews, total] = await Promise.all([
    PerformanceModel.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate("staffId", "firstName lastName department"),
    PerformanceModel.countDocuments(query),
  ]);

  return {
    reviews,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

export const addPatientRating = async (performanceId, ratingData, patientId) => {
  const performance = await PerformanceModel.findById(performanceId);
  if (!performance) {
    throw new AppError("Performance record not found", 404);
  }

  const newRating = {
    patientId,
    rating: ratingData.rating,
    comment: ratingData.comment,
  };

  performance.patientRatings.push(newRating);

  // Recalculate average rating
  const totalRating = performance.patientRatings.reduce((sum, r) => sum + r.rating, 0);
  performance.averageRating = totalRating / performance.patientRatings.length;

  await performance.save();

  return performance;
};

export const updatePerformanceReview = async (performanceId, updateData, userId) => {
  const performance = await PerformanceModel.findById(performanceId);
  if (!performance) {
    throw new AppError("Performance record not found", 404);
  }

  Object.assign(performance, updateData);

  // Recalculate completion rate if tasks changed
  if (updateData.tasksAssigned || updateData.tasksCompleted) {
    performance.completionRate =
      performance.tasksAssigned > 0
        ? (performance.tasksCompleted / performance.tasksAssigned) * 100
        : 0;
  }

  performance.reviewedBy = userId;
  performance.reviewDate = new Date();

  await performance.save();

  return performance.populate("staffId", "firstName lastName");
};

export const getStaffTopPerformers = async (limit = 10) => {
  const topPerformers = await PerformanceModel.find({ isActive: true })
    .sort({ averageRating: -1, completionRate: -1 })
    .limit(limit)
    .populate("staffId", "firstName lastName department position");

  return topPerformers;
};

export const getStaffDirectory = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [staff, total] = await Promise.all([
    StaffModel.find({ isActive: true, status: "active" })
      .select("firstName lastName email phone department position specializations")
      .sort({ firstName: 1 })
      .skip(skip)
      .limit(limit),
    StaffModel.countDocuments({ isActive: true, status: "active" }),
  ]);

  return {
    staff,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

export const getUnresolvedLeaveRequests = async () => {
  const pendingLeaves = await LeaveModel.find({ status: "pending", isActive: true })
    .populate("staffId", "firstName lastName email department")
    .sort({ createdAt: 1 });

  return pendingLeaves;
};

export const getStaffStatistics = async () => {
  const [totalStaff, activeStaff, onLeaveStaff, byDepartment, byPosition] = await Promise.all([
    StaffModel.countDocuments({ isActive: true }),
    StaffModel.countDocuments({ isActive: true, status: "active" }),
    StaffModel.countDocuments({ isActive: true, status: "on_leave" }),
    StaffModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    StaffModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$position", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    totalStaff,
    activeStaff,
    onLeaveStaff,
    inactiveStaff: totalStaff - activeStaff - onLeaveStaff,
    byDepartment,
    byPosition,
  };
};
