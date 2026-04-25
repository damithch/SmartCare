import { createJsonModel } from "./postgresModel.js";

const Medicine = createJsonModel("Medicine", {
  defaults: {
    unit: "pieces",
    isActive: true
  },
  refs: {
    addedBy: "User",
    lastUpdatedBy: "User"
  }
});

export default Medicine;
