import test from "node:test";
import assert from "node:assert/strict";
import Joi from "joi";
import { validate } from "../../src/middlewares/validate.middleware.js";
import AppError from "../../src/utils/appError.js";

const createResponse = () => ({});

test("validate passes sanitized body data to next middleware", () => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    role: Joi.string().valid("patient", "doctor").default("patient")
  });
  const middleware = validate(schema);
  const req = {
    body: {
      email: "user@example.com",
      extraField: "remove-me"
    }
  };
  const res = createResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.body, {
    email: "user@example.com",
    role: "patient"
  });
});

test("validate forwards AppError with field details on invalid payload", () => {
  const schema = Joi.object({
    fullName: Joi.string().min(2).required(),
    email: Joi.string().email().required()
  });
  const middleware = validate(schema);
  const req = {
    body: {
      fullName: "",
      email: "not-an-email"
    }
  };
  const res = createResponse();
  let receivedError = null;

  middleware(req, res, (error) => {
    receivedError = error;
  });

  assert.ok(receivedError instanceof AppError);
  assert.equal(receivedError.statusCode, 400);
  assert.equal(receivedError.code, "VALIDATION_ERROR");
  assert.equal(receivedError.message, "Validation failed");
  assert.deepEqual(receivedError.details, {
    fullName: '"fullName" is not allowed to be empty',
    email: '"email" must be a valid email'
  });
});
