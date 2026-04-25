import { createJsonModel } from "./postgresModel.js";

const LabTest = createJsonModel("LabTest", {
  defaults: {
    setupTime: 30,
    resultTurnaroundTime: 24,
    requiresPrep: false,
    isAvailable: true,
    isActive: true
  },
  refs: {
    addedBy: "User",
    lastUpdatedBy: "User"
  }
});

const LabTestRequest = createJsonModel("LabTestRequest", {
  defaults: {
    tests: [],
    status: "requested",
    isActive: true
  },
  refs: {
    patient: "User",
    doctor: "User",
    appointment: "Appointment",
    requestedBy: "User",
    test: "LabTest"
  }
});

const LabResult = createJsonModel("LabResult", {
  defaults: {
    status: "pending",
    abnormalFlag: false,
    attachments: [],
    qualityCheck: false,
    isActive: true
  },
  refs: {
    testRequest: "LabTestRequest",
    test: "LabTest",
    patient: "User",
    technician: "User",
    reviewedBy: "User",
    approvedBy: "User"
  }
});

export { LabTest, LabTestRequest, LabResult };
