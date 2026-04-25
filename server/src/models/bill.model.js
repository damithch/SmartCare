import { createJsonModel } from "./postgresModel.js";

const buildNumber = (prefix, count) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${prefix}-${year}${month}-${String(count + 1).padStart(5, "0")}`;
};

const Bill = createJsonModel("Bill", {
  defaults: {
    billItems: [],
    discount: 0,
    taxAmount: 0,
    taxPercentage: 0,
    insuranceCoverage: 0,
    status: "pending",
    isActive: true
  },
  refs: {
    patient: "User",
    appointment: "Appointment",
    generatedBy: "User",
    addedBy: "User"
  },
  beforeSave: async (doc, Model) => {
    if (!doc.billNumber) {
      doc.billNumber = buildNumber("BILL", await Model.countDocuments());
    }
    doc.amountDue = Number(doc.subtotal || 0) - Number(doc.discount || 0) + Number(doc.taxAmount || 0) - Number(doc.insuranceCoverage || 0);
  }
});

export default Bill;
