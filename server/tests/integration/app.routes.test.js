import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app.js";

test("GET /api/v1/health returns service status", async () => {
  const response = await request(app).get("/api/v1/health");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    success: true,
    message: "SmartCare backend is running"
  });
});

test("GET unknown route returns standardized 404 payload", async () => {
  const response = await request(app).get("/api/v1/does-not-exist");

  assert.equal(response.status, 404);
  assert.equal(response.body.success, false);
  assert.equal(response.body.error.code, "NOT_FOUND");
  assert.match(response.body.error.message, /Route not found/);
});

test("POST /api/v1/auth/register rejects invalid payload before service execution", async () => {
  const response = await request(app).post("/api/v1/auth/register").send({
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

test("POST /api/v1/auth/login rejects missing password", async () => {
  const response = await request(app).post("/api/v1/auth/login").send({
    email: "user@example.com"
  });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed",
      details: {
        password: '"password" is required'
      }
    }
  });
});
