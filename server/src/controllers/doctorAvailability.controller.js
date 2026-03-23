import asyncHandler from "../utils/asyncHandler.js";
import * as doctorAvailabilityService from "../services/doctorAvailability.service.js";

export const getMyAvailability = asyncHandler(async (req, res) => {
  const slots = await doctorAvailabilityService.listDoctorAvailability(req.user._id, req.query.date);

  res.status(200).json({
    success: true,
    data: slots
  });
});

export const getDoctorAvailability = asyncHandler(async (req, res) => {
  const slots = await doctorAvailabilityService.listAvailabilityForDoctor(
    req.query.doctorId,
    req.query.date
  );

  res.status(200).json({
    success: true,
    data: slots
  });
});

export const createMyAvailability = asyncHandler(async (req, res) => {
  const slot = await doctorAvailabilityService.createDoctorAvailability(req.user._id, {
    date: req.body.date,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    price: req.body.price,
    maxPatients: req.body.maxPatients
  });

  res.status(201).json({
    success: true,
    message: "Availability slot created successfully",
    data: slot
  });
});

export const deleteMyAvailability = asyncHandler(async (req, res) => {
  const slot = await doctorAvailabilityService.deleteDoctorAvailability(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: "Availability slot deleted successfully",
    data: slot
  });
});
