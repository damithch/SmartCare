import { createJsonModel } from "./postgresModel.js";

const Appointment = createJsonModel("Appointment", {
  defaults: {
    status: "pending",
    paymentStatus: "pending",
    amountPaid: 0,
    paymentCurrency: "usd"
  },
  refs: {
    patient: "User",
    doctor: "User",
    availabilitySlot: "DoctorAvailability"
  }
});

export default Appointment;
