import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app.js";

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
