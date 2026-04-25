import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app.js";
import { VALID_MONGO_ID, createUser, mockAuthenticatedUser } from "./helpers/auth-test-utils.js";

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
