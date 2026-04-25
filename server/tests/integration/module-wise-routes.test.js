import test, { mock } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../../src/app.js";
import User from "../../src/models/user.model.js";

const DEFAULT_USER_ID = "507f1f77bcf86cd799439011";
const VALID_MONGO_ID = "507f1f77bcf86cd799439012";

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

test("GET /api/v1/users validates admin query filters", async (t) => {
  const headers = mockAuthenticatedUser(t, createUser({ role: "admin" }));
  const response = await request(app)
    .get("/api/v1/users")
    .set(headers)
    .query({
      page: 0,
      sortOrder: "up",
      isActive: "maybe"
    });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: {
        page: "Page must be at least 1",
        isActive: "isActive must be 'true' or 'false'",
        sortOrder: "sortOrder must be 'asc' or 'desc'"
      }
    }
  });
});

test("PATCH /api/v1/users/me validates self-service profile updates", async (t) => {
  const headers = mockAuthenticatedUser(t, createUser({ role: "patient" }));
  const response = await request(app)
    .patch("/api/v1/users/me")
    .set(headers)
    .send({
      fullName: "A",
      email: "bad-email",
      password: "123"
    });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: {
        fullName: "Full name must be at least 2 characters",
        email: "Please provide a valid email",
        password: "Password must be at least 6 characters"
      }
    }
  });
});

test("POST /api/v1/auth/register rejects unsupported self-service roles", async () => {
  const response = await request(app)
    .post("/api/v1/auth/register")
    .send({
      fullName: "Test User",
      email: "user@example.com",
      password: "secret123",
      role: "admin"
    });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: {
        role: "Role must be one of: patient, doctor, pharmacist"
      }
    }
  });
});

test("POST /api/v1/auth/login rejects invalid email format", async () => {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email: "invalid-email",
      password: "secret123"
    });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: {
        email: "Please provide a valid email"
      }
    }
  });
});

test("POST /api/v1/appointments/checkout-intent validates patient checkout payload", async (t) => {
  const headers = mockAuthenticatedUser(t, createUser({ role: "patient" }));
  const response = await request(app)
    .post("/api/v1/appointments/checkout-intent")
    .set(headers)
    .send({
      patientId: "bad-patient-id",
      doctorId: "bad-doctor-id",
      availabilityId: "bad-availability-id"
    });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: {
        patientId: "Invalid patient ID format",
        doctorId: "Invalid doctor ID format",
        availabilityId: "Invalid availability slot ID format"
      }
    }
  });
});

test("GET /api/v1/appointments/:id validates appointment params", async (t) => {
  const headers = mockAuthenticatedUser(t, createUser({ role: "patient" }));
  const response = await request(app)
    .get("/api/v1/appointments/not-a-valid-id")
    .set(headers);

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: {
        id: "Invalid appointment ID format"
      }
    }
  });
});

test("GET /api/v1/appointments/my validates appointment query filters", async (t) => {
  const headers = mockAuthenticatedUser(t, createUser({ role: "patient" }));
  const response = await request(app)
    .get("/api/v1/appointments/my")
    .set(headers)
    .query({
      status: "queued",
      sortOrder: "up"
    });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: {
        status: '"status" must be one of [pending, approved, rejected, completed, cancelled]',
        sortOrder: '"sortOrder" must be one of [asc, desc]'
      }
    }
  });
});

test("POST /api/v1/medical-records validates doctor record payload", async (t) => {
  const headers = mockAuthenticatedUser(t, createUser({ role: "doctor" }));
  const response = await request(app)
    .post("/api/v1/medical-records")
    .set(headers)
    .send({
      patientId: "bad-patient-id",
      visitReason: "",
      symptoms: ""
    });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: {
        patientId: "Invalid patient ID format",
        visitReason: "Visit reason is required",
        symptoms: "Symptoms are required"
      }
    }
  });
});

test("GET /api/v1/medical-records/prescriptions/queue validates queue filters", async (t) => {
  const headers = mockAuthenticatedUser(t, createUser({ role: "pharmacist" }));
  const response = await request(app)
    .get("/api/v1/medical-records/prescriptions/queue")
    .set(headers)
    .query({
      status: "queued",
      limit: 0
    });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: {
        status: '"status" must be one of [pending, processing, dispensed, unavailable]',
        limit: '"limit" must be greater than or equal to 1'
      }
    }
  });
});

test("PATCH /api/v1/medicines/:id/stock validates pharmacist stock updates", async (t) => {
  const headers = mockAuthenticatedUser(t, createUser({ role: "pharmacist" }));
  const response = await request(app)
    .patch(`/api/v1/medicines/${VALID_MONGO_ID}/stock`)
    .set(headers)
    .send({
      quantityChange: "many",
      reason: "manual"
    });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: {
        quantityChange: "Quantity change must be a number",
        reason: "Reason must be one of: restock, dispense, expiry, damage, adjustment"
      }
    }
  });
});

test("GET /api/v1/medicines validates medicine listing filters", async (t) => {
  const headers = mockAuthenticatedUser(t, createUser({ role: "doctor" }));
  const response = await request(app)
    .get("/api/v1/medicines")
    .set(headers)
    .query({
      expiringWithin: 0,
      sortBy: "cost"
    });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: {
        expiringWithin: "Expiring within days must be at least 1",
        sortBy: '"sortBy" must be one of [name, quantity, expiryDate, price, createdAt]'
      }
    }
  });
});

test("GET /api/v1/bills validates bill listing filters", async (t) => {
  const headers = mockAuthenticatedUser(t, createUser({ role: "patient" }));
  const response = await request(app)
    .get("/api/v1/bills")
    .set(headers)
    .query({
      minAmount: -1,
      page: 0,
      sortOrder: "up"
    });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: {
        minAmount: '"minAmount" must be greater than or equal to 0',
        page: '"page" must be greater than or equal to 1',
        sortOrder: '"sortOrder" must be one of [asc, desc]'
      }
    }
  });
});

test("POST /api/v1/bills rejects unauthorized patient bill creation", async (t) => {
  const headers = mockAuthenticatedUser(t, createUser({ role: "patient" }));
  const response = await request(app)
    .post("/api/v1/bills")
    .set(headers)
    .send({});

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

test("POST /api/v1/payments validates payment payload before processing", async (t) => {
  const headers = mockAuthenticatedUser(t, createUser({ role: "patient" }));
  const response = await request(app)
    .post("/api/v1/payments")
    .set(headers)
    .send({
      amount: 0,
      paymentMethod: "wire"
    });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: {
        bill: "Bill ID is required",
        amount: "Payment amount must be greater than 0",
        paymentMethod: '"paymentMethod" must be one of [cash, card, check, insurance, bank_transfer, other]'
      }
    }
  });
});

test("PATCH /api/v1/payments/reconcile/batch validates reconciliation payload", async (t) => {
  const headers = mockAuthenticatedUser(t, createUser({ role: "admin" }));
  const response = await request(app)
    .patch("/api/v1/payments/reconcile/batch")
    .set(headers)
    .send({
      paymentIds: []
    });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: {
        paymentIds: '"paymentIds" must contain at least 1 items'
      }
    }
  });
});

test("POST /api/v1/staff/performance/review validates performance review payload", async (t) => {
  const headers = mockAuthenticatedUser(t, createUser({ role: "admin" }));
  const response = await request(app)
    .post("/api/v1/staff/performance/review")
    .set(headers)
    .send({
      staffId: "",
      year: 2019,
      month: 13,
      appointmentsHandled: -1
    });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: {
        staffId: '"staffId" is not allowed to be empty',
        year: '"year" must be greater than or equal to 2020',
        month: '"month" must be less than or equal to 12',
        appointmentsHandled: '"appointmentsHandled" must be greater than or equal to 0'
      }
    }
  });
});

test("POST /api/v1/staff/leave/request validates leave request payload", async (t) => {
  const headers = mockAuthenticatedUser(t, createUser({ role: "staff" }));
  const response = await request(app)
    .post("/api/v1/staff/leave/request")
    .set(headers)
    .send({
      staffId: "",
      leaveType: "vacation",
      startDate: "2026-05-10",
      endDate: "2026-05-09",
      numberOfDays: 0,
      reason: "short"
    });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: {
        staffId: '"staffId" is not allowed to be empty',
        leaveType: '"leaveType" must be one of [sick, casual, annual, maternity, paternity, unpaid]',
        endDate: '"endDate" must be greater than or equal to "ref:startDate"',
        numberOfDays: '"numberOfDays" must be a positive number',
        reason: '"reason" length must be at least 10 characters long'
      }
    }
  });
});

test("POST /api/v1/staff/:staffId/schedule validates schedule payload", async (t) => {
  const headers = mockAuthenticatedUser(t, createUser({ role: "admin" }));
  const response = await request(app)
    .post(`/api/v1/staff/${VALID_MONGO_ID}/schedule`)
    .set(headers)
    .send({
      staffId: "",
      shiftType: "split",
      startTime: "9:00 AM",
      endTime: "17:99",
      daysOfWeek: ["holiday"],
      startDate: "invalid-date"
    });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: {
        staffId: "Staff ID is required",
        shiftType: '"shiftType" must be one of [morning, afternoon, evening, night, flexible]',
        startTime: "Start time must be in HH:MM format",
        endTime: "End time must be in HH:MM format",
        "daysOfWeek.0": '"daysOfWeek[0]" must be one of [monday, tuesday, wednesday, thursday, friday, saturday, sunday]',
        startDate: '"startDate" must be a valid date'
      }
    }
  });
});
