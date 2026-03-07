import test, { afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import User from "../../../src/models/user.model.js";
import { authorize, protect } from "../../../src/middlewares/auth.middleware.js";

afterEach(() => {
  mock.restoreAll();
});

const invokeMiddleware = async (middleware, req = {}, res = {}) => {
  let nextError;
  const next = (err) => {
    nextError = err;
  };

  await middleware(req, res, next);
  return { req, res, nextError };
};

test("protect returns unauthorized when bearer token is missing", async () => {
  const { nextError } = await invokeMiddleware(protect, { headers: {} });

  assert.ok(nextError);
  assert.equal(nextError.statusCode, 401);
  assert.equal(nextError.code, "UNAUTHORIZED");
});

test("protect returns unauthorized on invalid token", async () => {
  mock.method(jwt, "verify", () => {
    throw new Error("bad token");
  });

  const { nextError } = await invokeMiddleware(protect, {
    headers: { authorization: "Bearer bad" }
  });

  assert.ok(nextError);
  assert.equal(nextError.statusCode, 401);
  assert.equal(nextError.code, "UNAUTHORIZED");
});

test("protect returns unauthorized when token user is missing", async () => {
  mock.method(jwt, "verify", () => ({ id: "missing-user" }));
  mock.method(User, "findById", () => ({
    select: async () => null
  }));

  const { nextError } = await invokeMiddleware(protect, {
    headers: { authorization: "Bearer valid" }
  });

  assert.ok(nextError);
  assert.equal(nextError.statusCode, 401);
});

test("protect returns account deactivated for inactive users", async () => {
  mock.method(jwt, "verify", () => ({ id: "inactive-user" }));
  mock.method(User, "findById", () => ({
    select: async () => ({ _id: "inactive-user", isActive: false })
  }));

  const { nextError } = await invokeMiddleware(protect, {
    headers: { authorization: "Bearer valid" }
  });

  assert.ok(nextError);
  assert.equal(nextError.statusCode, 403);
  assert.equal(nextError.code, "ACCOUNT_DEACTIVATED");
});

test("protect attaches user and calls next without error", async () => {
  mock.method(jwt, "verify", () => ({ id: "active-user" }));
  mock.method(User, "findById", () => ({
    select: async () => ({ _id: "active-user", role: "admin", isActive: true })
  }));

  const { req, nextError } = await invokeMiddleware(protect, {
    headers: { authorization: "Bearer valid" }
  });

  assert.equal(nextError, undefined);
  assert.equal(req.user._id, "active-user");
});

test("authorize blocks non-matching role", async () => {
  const middleware = authorize("admin");
  const { nextError } = await invokeMiddleware(middleware, {
    user: { role: "patient" }
  });

  assert.ok(nextError);
  assert.equal(nextError.statusCode, 403);
  assert.equal(nextError.code, "FORBIDDEN");
});

test("authorize allows matching role", async () => {
  const middleware = authorize("admin");
  const { nextError } = await invokeMiddleware(middleware, {
    user: { role: "admin" }
  });

  assert.equal(nextError, undefined);
});
