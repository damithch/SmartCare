import { createJsonModel } from "./postgresModel.js";

const DoctorAvailability = createJsonModel("DoctorAvailability", {
  defaults: {
    price: 0,
    maxPatients: 1,
    bookedCount: 0,
    isBooked: false
  },
  refs: {
    doctor: "User"
  }
});

export default DoctorAvailability;
