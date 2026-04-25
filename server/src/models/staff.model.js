import { createJsonModel } from "./postgresModel.js";

export const StaffModel = createJsonModel("Staff", {
  defaults: {
    specializations: [],
    credentials: [],
    qualifications: [],
    joiningDate: new Date().toISOString(),
    status: "active",
    isActive: true
  },
  refs: {
    addedBy: "User",
    lastUpdatedBy: "User"
  }
});

export const ScheduleModel = createJsonModel("Schedule", {
  defaults: {
    daysOfWeek: [],
    isOnCall: false,
    status: "active"
  },
  refs: {
    staffId: "Staff",
    addedBy: "User"
  }
});

export const AttendanceModel = createJsonModel("Attendance", {
  defaults: {
    hoursWorked: 0,
    status: "present",
    isActive: true
  },
  refs: {
    staffId: "Staff",
    approvedBy: "User"
  }
});

export const LeaveModel = createJsonModel("Leave", {
  defaults: {
    status: "pending",
    isActive: true
  },
  refs: {
    staffId: "Staff",
    approvedBy: "User"
  }
});

export const PerformanceModel = createJsonModel("Performance", {
  defaults: {
    appointmentsHandled: 0,
    appointmentsCompleted: 0,
    patientRatings: [],
    averageRating: 0,
    completionRate: 0,
    tasksAssigned: 0,
    tasksCompleted: 0,
    isActive: true
  },
  refs: {
    staffId: "Staff",
    reviewedBy: "User"
  }
});
