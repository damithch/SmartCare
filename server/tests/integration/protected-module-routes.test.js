import test, { mock } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../../src/app.js";
import User from "../../src/models/user.model.js";

const DEFAULT_USER_ID = "507f1f77bcf86cd799439011";

const createUser = ({ id = DEFAULT_USER_ID, role = "admin", isActive = true } = {}) => ({
  _id: id,
  id,
  role,
  isActive
});

const mockAuthenticatedUser = (t, user) => {
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

test("POST /api/v1/lab/tests requires authentication", async () => {
  const response = await request(app).post("/api/v1/lab/tests").send({});

  assert.equal(response.status, 401);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "UNAUTHORIZED",
      message: "Unauthorized",
      details: null
    }
  });
});

test("POST /api/v1/lab/tests forbids doctors from adding lab tests", async (t) => {
  const headers = mockAuthenticatedUser(t, createUser({ role: "doctor" }));
  const response = await request(app)
    .post("/api/v1/lab/tests")
    .set(headers)
    .send({
      testName: "CBC",
      category: "blood_test",
      price: 25
    });

  assert.equal(response.status, 403);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "FORBIDDEN",
      message: "Forbidden",
      details: null
    }
  });
});

test("POST /api/v1/staff validates admin requests before controller execution", async (t) => {
  const headers = mockAuthenticatedUser(t, createUser({ role: "admin" }));
  const response = await request(app)
    .post("/api/v1/staff")
    .set(headers)
    .send({
      firstName: "",
      lastName: "Perera",
      email: "invalid-email",
      phone: "123",
      department: "unknown",
      position: "unknown"
    });

  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error.code, "VALIDATION_ERROR");
  assert.equal(response.body.error.message, "Validation failed");
  assert.deepEqual(response.body.error.details, {
    firstName: "First name is required",
    email: "Please provide a valid email",
    phone: "Please provide a valid phone number",
    department: `"department" must be one of [cardiology, neurology, orthopedics, pediatrics, surgery, emergency, laboratory, pharmacy, nursing, administration, reception]`,
    position: `"position" must be one of [doctor, nurse, technician, staff, admin, receptionist, pharmacist, surgeon]`,
    joiningDate: `"joiningDate" is required`
  });
});

test("GET /api/v1/doctor-availability/me forbids non-doctors", async (t) => {
  const headers = mockAuthenticatedUser(t, createUser({ role: "patient" }));
  const response = await request(app)
    .get("/api/v1/doctor-availability/me")
    .set(headers);

  assert.equal(response.status, 403);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "FORBIDDEN",
      message: "Forbidden",
      details: null
    }
  });
});

test("GET /api/v1/doctor-availability validates lookup query for allowed roles", async (t) => {
  const headers = mockAuthenticatedUser(t, createUser({ role: "patient" }));
  const response = await request(app)
    .get("/api/v1/doctor-availability")
    .set(headers)
    .query({
      doctorId: "bad-id",
      date: "04-24-2026"
    });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: {
        doctorId: "Invalid doctor ID format",
        date: "Date must be in YYYY-MM-DD format"
      }
    }
  });
});
