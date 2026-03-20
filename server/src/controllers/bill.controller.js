import asyncHandler from "../utils/asyncHandler.js";
import * as billService from "../services/bill.service.js";
import AppError from "../utils/appError.js";
import { ROLES } from "../constants/roles.js";

// Create bill
export const createBill = asyncHandler(async (req, res) => {
  // Only billing staff and admin can create bills
  if (![ROLES.BILLING_STAFF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN].includes(req.user.role)) {
    throw new AppError("Only billing staff can create bills", 403, "FORBIDDEN");
  }

  const bill = await billService.createBill(req.body, req.user._id);

  return res.status(201).json({
    success: true,
    message: "Bill created successfully",
    data: bill,
  });
});

// Get all bills with filters
export const getAllBills = asyncHandler(async (req, res) => {
  // Authorization: Allow billing staff, doctor, and admin
  if (![ROLES.BILLING_STAFF, ROLES.DOCTOR, ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.HOSPITAL_MANAGER].includes(req.user.role)) {
    throw new AppError("Unauthorized to view bills", 403, "FORBIDDEN");
  }

  // Patients can only see their own bills
  if (req.user.role === ROLES.PATIENT) {
    req.body.patient = req.user._id;
  }

  const result = await billService.getAllBills(req.body);

  return res.status(200).json({
    success: true,
    message: "Bills retrieved successfully",
    data: result.bills,
    pagination: result.pagination,
  });
});

// Get bill by ID
export const getBillById = asyncHandler(async (req, res) => {
  const bill = await billService.getBillById(req.params.id);

  // Authorization: Patients can only view their own bills
  if (req.user.role === ROLES.PATIENT && bill.patient._id.toString() !== req.user._id.toString()) {
    throw new AppError("Unauthorized to view this bill", 403, "FORBIDDEN");
  }

  return res.status(200).json({
    success: true,
    message: "Bill retrieved successfully",
    data: bill,
  });
});

// Update bill
export const updateBill = asyncHandler(async (req, res) => {
  // Only billing staff and admin can update bills
  if (![ROLES.BILLING_STAFF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN].includes(req.user.role)) {
    throw new AppError("Only billing staff can update bills", 403, "FORBIDDEN");
  }

  const bill = await billService.updateBill(req.params.id, req.body);

  return res.status(200).json({
    success: true,
    message: "Bill updated successfully",
    data: bill,
  });
});

// Add item to bill
export const addItemToBill = asyncHandler(async (req, res) => {
  // Only billing staff and admin can add items
  if (![ROLES.BILLING_STAFF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN].includes(req.user.role)) {
    throw new AppError("Only billing staff can add items to bills", 403, "FORBIDDEN");
  }

  const bill = await billService.addItemToBill(req.params.id, req.body, req.user._id);

  return res.status(200).json({
    success: true,
    message: "Item added to bill successfully",
    data: bill,
  });
});

// Get outstanding bills
export const getOutstandingBills = asyncHandler(async (req, res) => {
  // Authorization
  if (![ROLES.BILLING_STAFF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.HOSPITAL_MANAGER].includes(req.user.role)) {
    throw new AppError("Unauthorized to view outstanding bills", 403, "FORBIDDEN");
  }

  const result = await billService.getOutstandingBills(req.body);

  return res.status(200).json({
    success: true,
    message: "Outstanding bills retrieved successfully",
    data: result.bills,
    pagination: result.pagination,
  });
});

// Calculate and update bill status
export const calculateBillStatus = asyncHandler(async (req, res) => {
  const bill = await billService.calculateBillStatus(req.params.id);

  return res.status(200).json({
    success: true,
    message: "Bill status updated successfully",
    data: bill,
  });
});

// Archive bill
export const archiveBill = asyncHandler(async (req, res) => {
  // Only billing staff and admin can archive
  if (![ROLES.BILLING_STAFF, ROLES.ADMIN, ROLES.SYSTEM_ADMIN].includes(req.user.role)) {
    throw new AppError("Only billing staff can archive bills", 403, "FORBIDDEN");
  }

  const bill = await billService.archiveBill(req.params.id);

  return res.status(200).json({
    success: true,
    message: "Bill archived successfully",
    data: bill,
  });
});

// Generate bill report
export const generateBillReport = asyncHandler(async (req, res) => {
  // Only admin and billing staff can generate reports
  if (![ROLES.ADMIN, ROLES.SYSTEM_ADMIN, ROLES.HOSPITAL_MANAGER, ROLES.BILLING_STAFF].includes(req.user.role)) {
    throw new AppError("Unauthorized to generate reports", 403, "FORBIDDEN");
  }

  const report = await billService.generateBillReport(req.body);

  return res.status(200).json({
    success: true,
    message: "Bill report generated successfully",
    data: report,
  });
});
