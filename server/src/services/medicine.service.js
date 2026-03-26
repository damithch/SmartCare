import Medicine from "../models/medicine.model.js";
import AppError from "../utils/appError.js";

export const addMedicine = async (medicineData, pharmacistId) => {
  // Check if medicine with same name and strength already exists
  const existingMedicine = await Medicine.findOne({
    name: medicineData.name,
    strength: medicineData.strength
  });

  if (existingMedicine) {
    throw new AppError(
      "Medicine with this name and strength already exists",
      409,
      "DUPLICATE_MEDICINE"
    );
  }

  const medicine = await Medicine.create({
    ...medicineData,
    addedBy: pharmacistId
  });

  return Medicine.findById(medicine._id).populate("addedBy", "fullName email");
};

export const getMedicineById = async (medicineId) => {
  const medicine = await Medicine.findById(medicineId)
    .populate("addedBy", "fullName email")
    .populate("lastUpdatedBy", "fullName email");

  if (!medicine) {
    throw new AppError("Medicine not found", 404, "MEDICINE_NOT_FOUND");
  }

  return medicine;
};

export const getAllMedicines = async (filters = {}) => {
  const {
    page = 1,
    limit = 10,
    category,
    search,
    expiringWithin,
    lowStock,
    sortBy = "name",
    sortOrder = "asc"
  } = filters;

  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), 100);
  const safeSortOrder = sortOrder === "desc" ? -1 : 1;
  const allowedSortFields = ["name", "quantity", "expiryDate", "price", "createdAt"];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "name";

  const query = { isActive: true };

  if (category) {
    query.category = category;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { manufacturer: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }

  if (expiringWithin) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + expiringWithin);
    query.expiryDate = { $lte: futureDate, $gte: new Date() };
  }

  if (lowStock === true) {
    query.$expr = { $lte: ["$quantity", "$reorderLevel"] };
  }

  const skip = (safePage - 1) * safeLimit;

  const [medicines, total] = await Promise.all([
    Medicine.find(query)
      .populate("addedBy", "fullName email")
      .sort({ [safeSortBy]: safeSortOrder })
      .skip(skip)
      .limit(safeLimit),
    Medicine.countDocuments(query)
  ]);

  return {
    medicines,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1
    }
  };
};

export const updateMedicine = async (medicineId, updateData, pharmacistId) => {
  const medicine = await Medicine.findById(medicineId);

  if (!medicine) {
    throw new AppError("Medicine not found", 404, "MEDICINE_NOT_FOUND");
  }

  // Update allowed fields
  if (updateData.description !== undefined) {
    medicine.description = updateData.description;
  }
  if (updateData.quantity !== undefined) {
    medicine.quantity = updateData.quantity;
  }
  if (updateData.price !== undefined) {
    medicine.price = updateData.price;
  }
  if (updateData.reorderLevel !== undefined) {
    medicine.reorderLevel = updateData.reorderLevel;
  }
  if (updateData.isActive !== undefined) {
    medicine.isActive = updateData.isActive;
  }

  medicine.lastUpdatedBy = pharmacistId;
  await medicine.save();

  return Medicine.findById(medicineId)
    .populate("addedBy", "fullName email")
    .populate("lastUpdatedBy", "fullName email");
};

export const updateStock = async (medicineId, { quantityChange, reason, notes }, pharmacistId) => {
  const medicine = await Medicine.findById(medicineId);

  if (!medicine) {
    throw new AppError("Medicine not found", 404, "MEDICINE_NOT_FOUND");
  }

  const newQuantity = medicine.quantity + quantityChange;

  if (newQuantity < 0) {
    throw new AppError("Insufficient stock for this operation", 400, "INSUFFICIENT_STOCK");
  }

  medicine.quantity = newQuantity;
  medicine.lastUpdatedBy = pharmacistId;
  await medicine.save();

  // TODO: Log stock transaction separately when audit log is implemented
  // This would track reason, notes, before/after quantities, etc.

  return Medicine.findById(medicineId)
    .populate("addedBy", "fullName email")
    .populate("lastUpdatedBy", "fullName email");
};

export const checkAvailability = async (medicineId, requiredQuantity) => {
  const medicine = await Medicine.findById(medicineId);

  if (!medicine) {
    throw new AppError("Medicine not found", 404, "MEDICINE_NOT_FOUND");
  }

  if (!medicine.isActive) {
    throw new AppError("Medicine is no longer available", 400, "MEDICINE_INACTIVE");
  }

  if (medicine.quantity < requiredQuantity) {
    throw new AppError("Insufficient stock available", 400, "INSUFFICIENT_STOCK");
  }

  // Check if expired
  if (medicine.expiryDate < new Date()) {
    throw new AppError("Medicine has expired", 400, "MEDICINE_EXPIRED");
  }

  return {
    available: true,
    quantity: medicine.quantity,
    price: medicine.price
  };
};

export const getMedicinesExpiringSoon = async (daysThreshold = 30) => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysThreshold);

  const medicines = await Medicine.find({
    expiryDate: { $lte: futureDate, $gte: new Date() },
    isActive: true
  })
    .populate("addedBy", "fullName email")
    .sort({ expiryDate: 1 });

  return medicines;
};

export const getLowStockMedicines = async () => {
  const medicines = await Medicine.find({
    $expr: { $lte: ["$quantity", "$reorderLevel"] },
    isActive: true
  })
    .populate("addedBy", "fullName email")
    .sort({ quantity: 1 });

  return medicines;
};

export const archiveMedicine = async (medicineId, pharmacistId) => {
  const medicine = await Medicine.findById(medicineId);

  if (!medicine) {
    throw new AppError("Medicine not found", 404, "MEDICINE_NOT_FOUND");
  }

  medicine.isActive = false;
  medicine.lastUpdatedBy = pharmacistId;
  await medicine.save();

  return Medicine.findById(medicineId)
    .populate("addedBy", "fullName email")
    .populate("lastUpdatedBy", "fullName email");
};
