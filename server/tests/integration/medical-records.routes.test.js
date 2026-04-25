import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app.js";
import { createUser, mockAuthenticatedUser } from "./helpers/auth-test-utils.js";

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
