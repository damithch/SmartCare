import { createJsonModel } from "./postgresModel.js";

const Refund = createJsonModel("Refund", {
  defaults: {
    status: "pending",
    isActive: true
  },
  refs: {
    payment: "Payment",
    appointment: "Appointment",
    bill: "Bill",
    patient: "User",
    approvedBy: "User",
    processedBy: "User"
  }
});

export default Refund;
