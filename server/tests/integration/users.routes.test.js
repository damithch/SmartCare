import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app.js";
import { createUser, mockAuthenticatedUser } from "./helpers/auth-test-utils.js";

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
