import { mock } from "node:test";
import jwt from "jsonwebtoken";
import User from "../../../src/models/user.model.js";

export const DEFAULT_USER_ID = "507f1f77bcf86cd799439011";
export const VALID_MONGO_ID = "507f1f77bcf86cd799439012";

export const createUser = ({ id = DEFAULT_USER_ID, role = "admin", isActive = true } = {}) => ({
  _id: id,
  id,
  role,
  isActive
});

export const mockAuthenticatedUser = (t, user) => {
  const verifyMock = mock.method(jwt, "verify", () => ({ id: user._id }));
  const findByIdMock = mock.method(User, "findById", () => ({
    select: async () => user
  }));

  t.after(() => {
    verifyMock.mock.restore();
    findByIdMock.mock.restore();
  });

  return { Authorization: "Bearer test-token" };
};
