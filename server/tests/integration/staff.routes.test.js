import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../../src/app.js";
import { VALID_MONGO_ID, createUser, mockAuthenticatedUser } from "./helpers/auth-test-utils.js";

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
