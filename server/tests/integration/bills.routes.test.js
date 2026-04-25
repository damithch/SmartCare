import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app.js";
import { createUser, mockAuthenticatedUser } from "./helpers/auth-test-utils.js";

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
