import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app.js";
import { createUser, mockAuthenticatedUser } from "./helpers/auth-test-utils.js";

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
