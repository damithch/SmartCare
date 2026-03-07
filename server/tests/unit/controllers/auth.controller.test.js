import test, { afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import { login, register } from "../../../src/controllers/auth.controller.js";
import User from "../../../src/models/user.model.js";

const createRes = () => {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };

  return res;
};

const invoke = async (handler, req) => {
  const res = createRes();
  let nextError;

  handler(req, res, (err) => {
    nextError = err;
  });

  await new Promise((resolve) => setImmediate(resolve));
  return { res, nextError };
};

afterEach(() => {
  mock.restoreAll();
});

test("register returns 201 with token and user payload", async () => {
  mock.method(User, "findOne", () => ({
    select: async () => null
  }));
  mock.method(User, "create", async (payload) => ({
    _id: "u1",
    fullName: payload.fullName,
    email: payload.email,
    role: payload.role
  }));

  const { res, nextError } = await invoke(register, {
    body: {
      fullName: "Demo User",
      email: "demo@example.com",
      password: "abc123",
      role: "patient"
    }
  });

  assert.equal(nextError, undefined);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.equal(typeof res.body.data.token, "string");
  assert.equal(res.body.data.user.id, "u1");
});

test("login returns 200 with token and user payload", async () => {
  mock.method(User, "findOne", () => ({
    select: async () => ({
      _id: "u2",
      fullName: "Admin",
      email: "admin@example.com",
      role: "admin",
      isActive: true,
      comparePassword: async () => true
    })
  }));

  const { res, nextError } = await invoke(login, {
    body: {
      email: "admin@example.com",
      password: "abc123"
    }
  });

  assert.equal(nextError, undefined);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(typeof res.body.data.token, "string");
  assert.equal(res.body.data.user.role, "admin");
});
