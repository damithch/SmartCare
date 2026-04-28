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
    amountPaid: 0,
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
    const totalPayable = Math.max(
      0,
      Number(doc.subtotal || 0) -
        Number(doc.discount || 0) +
        Number(doc.taxAmount || 0) -
        Number(doc.insuranceCoverage || 0)
    );

    if (doc.amountPaid === undefined || doc.amountPaid === null) {
      if (doc.status === "paid") {
        doc.amountPaid = totalPayable;
      } else if (doc.amountDue !== undefined && doc.amountDue !== null) {
        doc.amountPaid = Math.max(0, totalPayable - Number(doc.amountDue || 0));
      } else {
        doc.amountPaid = 0;
      }
    }

    doc.amountPaid = Math.min(totalPayable, Math.max(0, Number(doc.amountPaid || 0)));
    doc.amountDue = Math.max(0, totalPayable - doc.amountPaid);
  }
});

export default Bill;
