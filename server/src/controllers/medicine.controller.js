import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/appError.js";
import * as medicineService from "../services/medicine.service.js";

export const addMedicine = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    category,
    dosageForm,
    strength,
    manufacturer,
    batchNumber,
    manufacturingDate,
    expiryDate,
    quantity,
    unit,
    price,
    reorderLevel
  } = req.body;

  const medicine = await medicineService.addMedicine(
    {
      name,
      description,
      category,
      dosageForm,
      strength,
      manufacturer,
      batchNumber,
      manufacturingDate,
      expiryDate,
      quantity,
      unit,
      price,
      reorderLevel
    },
    req.user._id
  );

  res.status(201).json({
    success: true,
    message: "Medicine added successfully",
    data: medicine
  });
});

export const getMedicine = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const medicine = await medicineService.getMedicineById(id);

  res.status(200).json({
    success: true,
    data: medicine
  });
});

export const getAllMedicines = asyncHandler(async (req, res) => {
  const { page, limit, category, search, expiringWithin, lowStock, sortBy, sortOrder } =
    req.query;

  const result = await medicineService.getAllMedicines({
    page,
    limit,
    category,
    search,
    expiringWithin,
    lowStock: lowStock === "true",
    sortBy,
    sortOrder
  });

  res.status(200).json({
    success: true,
    data: result.medicines,
    pagination: result.pagination
  });
});

export const updateMedicine = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { description, quantity, price, reorderLevel, isActive } = req.body;

  const medicine = await medicineService.updateMedicine(
    id,
    { description, quantity, price, reorderLevel, isActive },
    req.user._id
  );

  res.status(200).json({
    success: true,
    message: "Medicine updated successfully",
    data: medicine
  });
});

export const updateStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantityChange, reason, notes } = req.body;

  const medicine = await medicineService.updateStock(
    id,
    { quantityChange, reason, notes },
    req.user._id
  );

  res.status(200).json({
    success: true,
    message: "Stock updated successfully",
    data: medicine
  });
});

export const checkAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    throw new AppError("Quantity must be at least 1", 400, "INVALID_QUANTITY");
  }

  const availability = await medicineService.checkAvailability(id, quantity);

  res.status(200).json({
    success: true,
    data: availability
  });
});

export const getExpiringMedicines = asyncHandler(async (req, res) => {
  const { withinDays } = req.query;
  const daysThreshold = parseInt(withinDays, 10) || 30;

  const medicines = await medicineService.getMedicinesExpiringSoon(daysThreshold);

  res.status(200).json({
    success: true,
    data: medicines
  });
});

export const getLowStockMedicines = asyncHandler(async (req, res) => {
  const medicines = await medicineService.getLowStockMedicines();

  res.status(200).json({
    success: true,
    data: medicines
  });
});

export const archiveMedicine = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const medicine = await medicineService.archiveMedicine(id, req.user._id);

  res.status(200).json({
    success: true,
    message: "Medicine archived successfully",
    data: medicine
  });
});
