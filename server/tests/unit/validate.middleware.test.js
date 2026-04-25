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

test("validate sanitizes query data when a non-body source is provided", () => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    sortOrder: Joi.string().valid("asc", "desc").default("asc")
  });
  const middleware = validate(schema, "query");
  const req = {
    query: {
      page: "2",
      ignored: "remove-me"
    }
  };
  const res = createResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.query, {
    page: 2,
    sortOrder: "asc"
  });
});

test("validate reports nested field paths for invalid params data", () => {
  const schema = Joi.object({
    filter: Joi.object({
      id: Joi.string().length(24).required()
    }).required()
  });
  const middleware = validate(schema, "params");
  const req = {
    params: {
      filter: {
        id: "short-id"
      }
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
  assert.deepEqual(receivedError.details, {
    "filter.id": '"filter.id" length must be 24 characters long'
  });
});
