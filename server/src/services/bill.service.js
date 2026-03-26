import Bill from "../models/bill.model.js";
import User from "../models/user.model.js";
import Appointment from "../models/appointment.model.js";
import AppError from "../utils/appError.js";

// 1. Create bill
export const createBill = async (billData, generatedBy) => {
  const { patient, appointment, billItems, subtotal, discount, discountReason, taxPercentage, insuranceCoverage, dueDate, notes } = billData;

  // Validate patient exists
  const patientExists = await User.findById(patient);
  if (!patientExists) {
    throw new AppError("Patient not found", 404, "PATIENT_NOT_FOUND");
  }

  // Validate appointment if provided
  if (appointment) {
    const appointmentExists = await Appointment.findById(appointment);
    if (!appointmentExists) {
      throw new AppError("Appointment not found", 404, "APPOINTMENT_NOT_FOUND");
    }
  }

  const taxAmount = (subtotal * taxPercentage) / 100;

  const bill = new Bill({
    patient,
    appointment,
    billItems,
    subtotal,
    discount,
    discountReason,
    taxPercentage,
    taxAmount,
    insuranceCoverage,
    dueDate,
    notes,
    generatedBy,
    status: "pending",
  });

  await bill.save();
  return bill.populate("patient", "fullName email phone").populate("appointment").populate("generatedBy", "fullName email");
};

// 2. Get bill by ID
export const getBillById = async (billId) => {
  const bill = await Bill.findById(billId)
    .populate("patient", "fullName email phone")
    .populate("appointment")
    .populate("generatedBy", "fullName email")
    .populate("billItems.addedBy", "fullName");

  if (!bill) {
    throw new AppError("Bill not found", 404, "BILL_NOT_FOUND");
  }

  return bill;
};

// 3. Get all bills with filters and pagination
export const getAllBills = async (filters) => {
  const { patient, status, startDate, endDate, minAmount, maxAmount, search, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = filters;

  const query = { isActive: true };

  if (patient) query.patient = patient;
  if (status) query.status = status;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (minAmount !== undefined || maxAmount !== undefined) {
    query.amountDue = {};
    if (minAmount !== undefined) query.amountDue.$gte = minAmount;
    if (maxAmount !== undefined) query.amountDue.$lte = maxAmount;
  }

  if (search) {
    query.$or = [
      { billNumber: new RegExp(search, "i") },
      { "patient.fullName": new RegExp(search, "i") },
    ];
  }

  const skip = (page - 1) * limit;
  const sortObj = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const bills = await Bill.find(query)
    .sort(sortObj)
    .skip(skip)
    .limit(limit)
    .populate("patient", "fullName email phone")
    .populate("appointment")
    .populate("generatedBy", "fullName email");

  const total = await Bill.countDocuments(query);

  return {
    bills,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// 4. Update bill
export const updateBill = async (billId, updateData) => {
  const bill = await Bill.findById(billId);
  if (!bill) {
    throw new AppError("Bill not found", 404, "BILL_NOT_FOUND");
  }

  if (bill.status === "paid" || bill.status === "cancelled") {
    throw new AppError("Cannot update paid or cancelled bills", 400, "BILL_UPDATE_NOT_ALLOWED");
  }

  Object.assign(bill, updateData);
  await bill.save();

  return bill.populate("patient", "fullName email phone").populate("appointment").populate("generatedBy", "fullName email");
};

// 5. Add item to bill
export const addItemToBill = async (billId, itemData, addedBy) => {
  const bill = await Bill.findById(billId);
  if (!bill) {
    throw new AppError("Bill not found", 404, "BILL_NOT_FOUND");
  }

  if (bill.status === "paid" || bill.status === "cancelled") {
    throw new AppError("Cannot add items to paid or cancelled bills", 400, "BILL_UPDATE_NOT_ALLOWED");
  }

  const newItem = {
    ...itemData,
    addedBy,
    addedAt: new Date(),
  };

  bill.billItems.push(newItem);

  // Recalculate subtotal, tax, and amountDue
  bill.subtotal = bill.billItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxAmount = (bill.subtotal * bill.taxPercentage) / 100;
  bill.taxAmount = taxAmount;
  bill.amountDue = bill.subtotal - bill.discount + bill.taxAmount - bill.insuranceCoverage;

  await bill.save();

  return bill.populate("patient", "fullName email phone").populate("billItems.addedBy", "fullName");
};

// 6. Get outstanding bills (unpaid/overdue)
export const getOutstandingBills = async (filters) => {
  const { patient, page = 1, limit = 10 } = filters;

  const query = {
    isActive: true,
    status: { $in: ["pending", "partial", "overdue"] },
  };

  if (patient) query.patient = patient;

  const skip = (page - 1) * limit;

  const bills = await Bill.find(query)
    .sort({ dueDate: 1 })
    .skip(skip)
    .limit(limit)
    .populate("patient", "fullName email phone")
    .populate("appointment");

  const total = await Bill.countDocuments(query);

  return {
    bills,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// 7. Calculate and update bill status
export const calculateBillStatus = async (billId) => {
  const bill = await Bill.findById(billId);
  if (!bill) {
    throw new AppError("Bill not found", 404, "BILL_NOT_FOUND");
  }

  const today = new Date();

  if (bill.status === "paid" || bill.status === "cancelled") {
    return bill;
  }

  // Check if overdue
  if (bill.dueDate && bill.dueDate < today && bill.status !== "paid") {
    bill.status = "overdue";
  }

  await bill.save();
  return bill;
};

// 8. Archive bill (soft delete)
export const archiveBill = async (billId) => {
  const bill = await Bill.findById(billId);
  if (!bill) {
    throw new AppError("Bill not found", 404, "BILL_NOT_FOUND");
  }

  bill.isActive = false;
  bill.status = "cancelled";
  await bill.save();

  return bill;
};

// 9. Generate bill report
export const generateBillReport = async (filters) => {
  const { startDate, endDate, status } = filters;

  const query = { isActive: true };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (status) query.status = status;

  const bills = await Bill.find(query).populate("patient", "fullName");

  const report = {
    totalBills: bills.length,
    totalAmount: 0,
    totalTax: 0,
    totalDiscount: 0,
    totalInsuranceCoverage: 0,
    totalOutstanding: 0,
    billingByStatus: {},
    topPatients: [],
  };

  const patientMap = {};

  bills.forEach((bill) => {
    report.totalAmount += bill.amountDue;
    report.totalTax += bill.taxAmount;
    report.totalDiscount += bill.discount;
    report.totalInsuranceCoverage += bill.insuranceCoverage;

    if (bill.status !== "paid") {
      report.totalOutstanding += bill.amountDue;
    }

    // Count by status
    report.billingByStatus[bill.status] = (report.billingByStatus[bill.status] || 0) + 1;

    // Track patient spending
    const patientId = bill.patient._id.toString();
    if (!patientMap[patientId]) {
      patientMap[patientId] = {
        patientName: bill.patient.fullName,
        totalBilled: 0,
        billCount: 0,
      };
    }
    patientMap[patientId].totalBilled += bill.amountDue;
    patientMap[patientId].billCount += 1;
  });

  // Get top 10 patients
  report.topPatients = Object.values(patientMap)
    .sort((a, b) => b.totalBilled - a.totalBilled)
    .slice(0, 10);

  return report;
};
