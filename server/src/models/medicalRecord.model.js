import crypto from "crypto";
import { createJsonModel } from "./postgresModel.js";

const subId = () => crypto.randomBytes(12).toString("hex");

const MedicalRecord = createJsonModel("MedicalRecord", {
  defaults: {
    diagnoses: [],
    prescriptions: [],
    followUpRequired: false,
    status: "completed"
  },
  refs: {
    patient: "User",
    doctor: "User",
    appointment: "Appointment",
    diagnosedBy: "User",
    prescribedBy: "User"
  },
  beforeSave: async (doc) => {
    doc.diagnoses = (doc.diagnoses || []).map((diagnosis) => ({
      ...diagnosis,
      _id: diagnosis._id || subId()
    }));
    doc.prescriptions = (doc.prescriptions || []).map((prescription) => ({
      ...prescription,
      _id: prescription._id || subId()
    }));
  }
});

export default MedicalRecord;
