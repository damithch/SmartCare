import asyncHandler from "../utils/asyncHandler.js";
import * as labService from "../services/lab.service.js";
import AppError from "../utils/appError.js";
import { ROLES } from "../constants/roles.js";

// ============ LAB TEST CATALOG CONTROLLERS ============

// Add lab test
export const addLabTest = asyncHandler(async (req, res) => {
  // Only admin can add lab tests
  if (![ROLES.ADMIN, ROLES.SYSTEM_ADMIN].includes(req.user.role)) {
    throw new AppError("Only admin can add lab tests", 403, "FORBIDDEN");
  }

  const test = await labService.addLabTest(req.body, req.user._id);

  return res.status(201).json({
    success: true,
    message: "Lab test added successfully",
    data: test,
  });
});

// Get all lab tests
export const getAllLabTests = asyncHandler(async (req, res) => {
  const result = await labService.getAllLabTests(req.query);

  return res.status(200).json({
    success: true,
    message: "Lab tests retrieved successfully",
    data: result.tests,
    pagination: result.pagination,
  });
});

// Get lab test by ID
export const getLabTestById = asyncHandler(async (req, res) => {
  const test = await labService.getLabTestById(req.params.id);

  return res.status(200).json({
    success: true,
    message: "Lab test retrieved successfully",
    data: test,
  });
});

// Update lab test
export const updateLabTest = asyncHandler(async (req, res) => {
  // Only admin can update lab tests
  if (![ROLES.ADMIN, ROLES.SYSTEM_ADMIN].includes(req.user.role)) {
    throw new AppError("Only admin can update lab tests", 403, "FORBIDDEN");
  }

  const test = await labService.updateLabTest(req.params.id, req.body, req.user._id);

  return res.status(200).json({
    success: true,
    message: "Lab test updated successfully",
    data: test,
  });
});

// ============ LAB TEST REQUEST CONTROLLERS ============

// Create lab test request
export const createLabTestRequest = asyncHandler(async (req, res) => {
  // Only doctor and admin can request tests
  if (![ROLES.DOCTOR, ROLES.ADMIN, ROLES.SYSTEM_ADMIN].includes(req.user.role)) {
    throw new AppError("Only doctors can request lab tests", 403, "FORBIDDEN");
  }

  const request = await labService.createLabTestRequest(req.body, req.user._id);

  return res.status(201).json({
    success: true,
    message: "Lab test request created successfully",
    data: request,
  });
});

// Get lab test requests
export const getLabTestRequests = asyncHandler(async (req, res) => {
  // Authorization: doctors see their requests, patients see own, admin sees all
  if (req.user.role === ROLES.PATIENT) {
    req.query.patient = req.user._id;
  } else if (req.user.role === ROLES.DOCTOR) {
    req.query.doctor = req.user._id;
  }

  const result = await labService.getLabTestRequests(req.query);

  return res.status(200).json({
    success: true,
    message: "Lab test requests retrieved successfully",
    data: result.requests,
    pagination: result.pagination,
  });
});

// Update test request status
export const updateTestRequestStatus = asyncHandler(async (req, res) => {
  // Only doctor, lab staff, and admin can update status
  if (![ROLES.DOCTOR, ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.STAFF].includes(req.user.role)) {
    throw new AppError("Unauthorized to update test requests", 403, "FORBIDDEN");
  }

  const request = await labService.updateTestRequestStatus(req.params.id, req.body);

  return res.status(200).json({
    success: true,
    message: "Lab test request updated successfully",
    data: request,
  });
});

// ============ LAB RESULT CONTROLLERS ============

// Create lab result
export const createLabResult = asyncHandler(async (req, res) => {
  // Only lab technician, doctor, and admin can create results
  if (![ROLES.STAFF, ROLES.DOCTOR, ROLES.ADMIN, ROLES.SYSTEM_ADMIN].includes(req.user.role)) {
    throw new AppError("Only lab staff can create results", 403, "FORBIDDEN");
  }

  const result = await labService.createLabResult(req.body, req.user._id);

  return res.status(201).json({
    success: true,
    message: "Lab result created successfully",
    data: result,
  });
});

// Get lab results
export const getLabResults = asyncHandler(async (req, res) => {
  // Authorization: patients see own, doctors see their patients, admin sees all
  if (req.user.role === ROLES.PATIENT) {
    req.query.patient = req.user._id;
  }

  const result = await labService.getLabResults(req.query);

  return res.status(200).json({
    success: true,
    message: "Lab results retrieved successfully",
    data: result.results,
    pagination: result.pagination,
  });
});

// Update lab result
export const updateLabResult = asyncHandler(async (req, res) => {
  // Only lab staff and doctor can update results
  if (![ROLES.STAFF, ROLES.DOCTOR, ROLES.ADMIN, ROLES.SYSTEM_ADMIN].includes(req.user.role)) {
    throw new AppError("Unauthorized to update results", 403, "FORBIDDEN");
  }

  const result = await labService.updateLabResult(req.params.id, req.body);

  return res.status(200).json({
    success: true,
    message: "Lab result updated successfully",
    data: result,
  });
});

// Approve lab result
export const approveLabResult = asyncHandler(async (req, res) => {
  // Only doctor and admin can approve results
  if (![ROLES.DOCTOR, ROLES.ADMIN, ROLES.SYSTEM_ADMIN].includes(req.user.role)) {
    throw new AppError("Only doctors can approve results", 403, "FORBIDDEN");
  }

  const result = await labService.approveLabResult(
    req.params.id,
    req.user._id,
    req.body.approved,
    req.body.interpretation,
    req.body.rejectionReason
  );

  return res.status(200).json({
    success: true,
    message: req.body.approved ? "Result approved successfully" : "Result rejected successfully",
    data: result,
  });
});

// Get lab report
export const getLabReport = asyncHandler(async (req, res) => {
  // Only admin and doctor can view reports
  if (![ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.DOCTOR, ROLES.HOSPITAL_MANAGER].includes(req.user.role)) {
    throw new AppError("Unauthorized to view reports", 403, "FORBIDDEN");
  }

  const report = await labService.getLabReport(req.query);

  return res.status(200).json({
    success: true,
    message: "Lab report generated successfully",
    data: report,
  });
});
