import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app.js";
import { createUser, mockAuthenticatedUser } from "./helpers/auth-test-utils.js";

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
