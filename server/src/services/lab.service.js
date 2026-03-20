import { LabTest, LabTestRequest, LabResult } from "../models/lab.model.js";
import User from "../models/user.model.js";
import AppError from "../utils/appError.js";

// ============ LAB TEST CATALOG FUNCTIONS ============

// 1. Add lab test
export const addLabTest = async (testData, addedBy) => {
  // Check if test already exists
  const existingTest = await LabTest.findOne({ testName: testData.testName });
  if (existingTest) {
    throw new AppError("Test with this name already exists", 400, "DUPLICATE_TEST");
  }

  const labTest = new LabTest({
    ...testData,
    addedBy,
  });

  await labTest.save();
  return labTest.populate("addedBy", "fullName email");
};

// 2. Get all lab tests with filters
export const getAllLabTests = async (filters) => {
  const { category, search, isAvailable, minPrice, maxPrice, page = 1, limit = 10, sortBy = "testName", sortOrder = "asc" } = filters;

  const query = { isActive: true };

  if (category) query.category = category;
  if (isAvailable === "true") query.isAvailable = true;
  if (isAvailable === "false") query.isAvailable = false;

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = minPrice;
    if (maxPrice !== undefined) query.price.$lte = maxPrice;
  }

  if (search) {
    query.$or = [
      { testName: new RegExp(search, "i") },
      { description: new RegExp(search, "i") },
    ];
  }

  const skip = (page - 1) * limit;
  const sortObj = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const tests = await LabTest.find(query)
    .sort(sortObj)
    .skip(skip)
    .limit(limit)
    .populate("addedBy", "fullName");

  const total = await LabTest.countDocuments(query);

  return {
    tests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// 3. Get lab test by ID
export const getLabTestById = async (testId) => {
  const test = await LabTest.findById(testId).populate("addedBy", "fullName email");

  if (!test) {
    throw new AppError("Lab test not found", 404, "TEST_NOT_FOUND");
  }

  return test;
};

// 4. Update lab test
export const updateLabTest = async (testId, updateData, lastUpdatedBy) => {
  const test = await LabTest.findById(testId);
  if (!test) {
    throw new AppError("Lab test not found", 404, "TEST_NOT_FOUND");
  }

  Object.assign(test, updateData);
  test.lastUpdatedBy = lastUpdatedBy;
  await test.save();

  return test.populate("addedBy", "fullName").populate("lastUpdatedBy", "fullName");
};

// ============ LAB TEST REQUEST FUNCTIONS ============

// 5. Create lab test request
export const createLabTestRequest = async (requestData, requestedBy) => {
  const { patient, doctor, tests } = requestData;

  // Validate patient and doctor exist
  const patientExists = await User.findById(patient);
  if (!patientExists) {
    throw new AppError("Patient not found", 404, "PATIENT_NOT_FOUND");
  }

  const doctorExists = await User.findById(doctor);
  if (!doctorExists) {
    throw new AppError("Doctor not found", 404, "DOCTOR_NOT_FOUND");
  }

  // Calculate total amount
  let totalAmount = 0;
  const populatedTests = await Promise.all(
    tests.map(async (t) => {
      const test = await LabTest.findById(t.test);
      if (!test) {
        throw new AppError(`Test ${t.test} not found`, 404, "TEST_NOT_FOUND");
      }
      totalAmount += test.price * (t.quantity || 1);
      return t;
    })
  );

  const testRequest = new LabTestRequest({
    patient,
    doctor,
    tests: populatedTests,
    totalAmount,
    requestedBy,
    status: "requested",
    ...requestData,
  });

  await testRequest.save();
  return testRequest
    .populate("patient", "fullName email phone")
    .populate("doctor", "fullName specialization")
    .populate("tests.test", "testName category price")
    .populate("requestedBy", "fullName");
};

// 6. Get lab test requests with filters
export const getLabTestRequests = async (filters) => {
  const { patient, doctor, status, priority, startDate, endDate, search, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = filters;

  const query = { isActive: true };

  if (patient) query.patient = patient;
  if (doctor) query.doctor = doctor;
  if (status) query.status = status;

  // Filter by test priority
  if (priority) {
    query["tests.priority"] = priority;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (search) {
    query.$or = [{ referralNumber: new RegExp(search, "i") }];
  }

  const skip = (page - 1) * limit;
  const sortObj = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const requests = await LabTestRequest.find(query)
    .sort(sortObj)
    .skip(skip)
    .limit(limit)
    .populate("patient", "fullName email")
    .populate("doctor", "fullName specialization")
    .populate("tests.test", "testName price");

  const total = await LabTestRequest.countDocuments(query);

  return {
    requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// 7. Update test request status
export const updateTestRequestStatus = async (requestId, statusData) => {
  const request = await LabTestRequest.findById(requestId);
  if (!request) {
    throw new AppError("Test request not found", 404, "REQUEST_NOT_FOUND");
  }

  if (statusData.status === "cancelled" && !statusData.cancellationReason) {
    throw new AppError("Cancellation reason is required", 400, "MISSING_REASON");
  }

  Object.assign(request, statusData);

  if (statusData.status === "completed") {
    request.completionDate = new Date();
  }

  await request.save();

  return request
    .populate("patient", "fullName email")
    .populate("doctor", "fullName")
    .populate("tests.test", "testName");
};

// ============ LAB RESULT FUNCTIONS ============

// 8. Create lab result
export const createLabResult = async (resultData, technician) => {
  const { testRequest, test } = resultData;

  // Validate test request exists
  const request = await LabTestRequest.findById(testRequest);
  if (!request) {
    throw new AppError("Test request not found", 404, "REQUEST_NOT_FOUND");
  }

  const labResult = new LabResult({
    ...resultData,
    technician,
    status: "pending",
  });

  await labResult.save();
  return labResult
    .populate("testRequest")
    .populate("test", "testName category")
    .populate("patient", "fullName email")
    .populate("technician", "fullName");
};

// 9. Get lab results with filters
export const getLabResults = async (filters) => {
  const { patient, testRequest, status, abnormalFlag, startDate, endDate, search, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = filters;

  const query = { isActive: true };

  if (patient) query.patient = patient;
  if (testRequest) query.testRequest = testRequest;
  if (status) query.status = status;
  if (abnormalFlag === "true") query.abnormalFlag = true;
  if (abnormalFlag === "false") query.abnormalFlag = false;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;
  const sortObj = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

  const results = await LabResult.find(query)
    .sort(sortObj)
    .skip(skip)
    .limit(limit)
    .populate("testRequest", "referralNumber")
    .populate("test", "testName")
    .populate("patient", "fullName email")
    .populate("technician", "fullName")
    .populate("reviewedBy", "fullName");

  const total = await LabResult.countDocuments(query);

  return {
    results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// 10. Update lab result
export const updateLabResult = async (resultId, updateData) => {
  const result = await LabResult.findById(resultId);
  if (!result) {
    throw new AppError("Lab result not found", 404, "RESULT_NOT_FOUND");
  }

  if (updateData.status === "completed" && !result.completedAt) {
    result.completedAt = new Date();
  }

  Object.assign(result, updateData);
  await result.save();

  return result
    .populate("testRequest")
    .populate("test", "testName")
    .populate("patient", "fullName email");
};

// 11. Approve/Review result
export const approveLabResult = async (resultId, approvedBy, approved, interpretation, rejectionReason) => {
  const result = await LabResult.findById(resultId);
  if (!result) {
    throw new AppError("Lab result not found", 404, "RESULT_NOT_FOUND");
  }

  if (approved) {
    result.status = "reviewed";
    result.interpretation = interpretation;
    result.approvedBy = approvedBy;
    result.approvedAt = new Date();
    result.qualityCheck = true;
  } else {
    result.status = "pending";
    result.rejectionReason = rejectionReason;
  }

  await result.save();

  return result
    .populate("testRequest")
    .populate("test", "testName")
    .populate("patient", "fullName email")
    .populate("approvedBy", "fullName");
};

// 12. Get lab statistics/report
export const getLabReport = async (filters) => {
  const { startDate, endDate, category } = filters;

  const query = { isActive: true };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const requests = await LabTestRequest.find(query);
  const results = await LabResult.find(query);

  const report = {
    totalTestsRequested: requests.length,
    totalResultsGenerated: results.length,
    requestsByStatus: {},
    resultsByStatus: {},
    abnormalResults: 0,
    pendingResults: 0,
    completionRate: 0,
  };

  // Count by request status
  requests.forEach((req) => {
    report.requestsByStatus[req.status] = (report.requestsByStatus[req.status] || 0) + 1;
  });

  // Count by result status
  results.forEach((res) => {
    report.resultsByStatus[res.status] = (report.resultsByStatus[res.status] || 0) + 1;
    if (res.abnormalFlag) report.abnormalResults += 1;
    if (res.status === "pending") report.pendingResults += 1;
  });

  report.completionRate = requests.length > 0 ? ((results.length / requests.length) * 100).toFixed(2) : 0;

  return report;
};
