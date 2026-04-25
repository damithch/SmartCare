import bcrypt from "bcryptjs";
import { ROLES } from "../constants/roles.js";
import { createJsonModel } from "./postgresModel.js";

const User = createJsonModel("User", {
  defaults: {
    role: ROLES.PATIENT,
    phone: "",
    studentId: "",
    department: "",
    level: "",
    bio: "",
    specialization: "",
    consultationFee: 0,
    avatar: "",
    coverImage: "",
    isActive: true
  },
  beforeSave: async (doc) => {
    if (doc.password && (doc.__isNew || doc.isModified("password"))) {
      doc.password = await bcrypt.hash(doc.password, 10);
    }
    if (doc.email) doc.email = doc.email.trim().toLowerCase();
  }
});

User.prototype.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

export default User;
