import { createJsonModel } from "./postgresModel.js";

const buildNumber = (prefix, count) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${prefix}-${year}${month}-${String(count + 1).padStart(5, "0")}`;
};

const Payment = createJsonModel("Payment", {
  defaults: {
    status: "pending",
    reconciled: false,
    isRefunded: false,
    refundedAmount: 0,
    isActive: true
  },
  refs: {
    bill: "Bill",
    patient: "User",
    reconciledBy: "User",
    refund: "Refund",
    processedBy: "User"
  },
  beforeSave: async (doc, Model) => {
    if (!doc.transactionReference) {
      doc.transactionReference = buildNumber("PAY", await Model.countDocuments());
    }
  }
});

export default Payment;
