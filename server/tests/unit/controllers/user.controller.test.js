import test, { afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import {
  createUserAdmin,
  deleteUserAdmin,
  getMyProfile,
  getUserAdminById,
  listUsers,
  updateUserAdmin,
  updateOwnProfile
} from "../../../src/controllers/user.controller.js";
import User from "../../../src/models/user.model.js";

afterEach(() => {
  mock.restoreAll();
});

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

test("listUsers returns users with pagination", async () => {
  mock.method(User, "find", () => ({
    select() {
      return this;
    },
    sort() {
      return this;
    },
    skip() {
      return this;
    },
    limit: async () => [{ _id: "u1", fullName: "User One" }]
  }));
  mock.method(User, "countDocuments", async () => 1);

  const { res, nextError } = await invoke(listUsers, { query: {} });

  assert.equal(nextError, undefined);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.length, 1);
  assert.equal(res.body.pagination.total, 1);
});

test("getUserAdminById forwards not-found error to next", async () => {
  mock.method(User, "findById", () => ({
    select: async () => null
  }));

  const { nextError } = await invoke(getUserAdminById, {
    params: { id: "507f1f77bcf86cd799439011" }
  });

  assert.ok(nextError);
  assert.equal(nextError.statusCode, 404);
  assert.equal(nextError.code, "USER_NOT_FOUND");
});

test("getMyProfile returns current user profile", async () => {
  mock.method(User, "findById", () => ({
    select: async () => ({ _id: "u10", fullName: "Me" })
  }));

  const { res, nextError } = await invoke(getMyProfile, {
    user: { _id: "u10" }
  });

  assert.equal(nextError, undefined);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data._id, "u10");
});

test("createUserAdmin returns created user", async () => {
  let findByIdCalls = 0;
  mock.method(User, "findOne", async () => null);
  mock.method(User, "create", async () => ({ _id: "u11" }));
  mock.method(User, "findById", () => {
    findByIdCalls += 1;
    if (findByIdCalls === 1) {
      return {
        select: async () => ({ _id: "u11", fullName: "Created User", role: "doctor" })
      };
    }

    return {
      select: async () => ({ _id: "u11", fullName: "Created User", role: "doctor" })
    };
  });

  const { res, nextError } = await invoke(createUserAdmin, {
    body: {
      fullName: "Created User",
      email: "doctor@example.com",
      password: "abc123",
      role: "doctor"
    }
  });

  assert.equal(nextError, undefined);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.data._id, "u11");
});

test("updateOwnProfile returns updated user", async () => {
  let findByIdCalls = 0;
  mock.method(User, "findById", () => {
    findByIdCalls += 1;

    if (findByIdCalls === 1) {
      return {
        select: async () => ({
          _id: "u3",
          fullName: "Old Name",
          email: "old@example.com",
          role: "patient",
          save: async () => {}
        })
      };
    }

    return {
      select: async () => ({
        _id: "u3",
        fullName: "Updated User",
        email: "old@example.com",
        role: "patient"
      })
    };
  });

  const { res, nextError } = await invoke(updateOwnProfile, {
    user: { _id: "u3", role: "patient" },
    body: { fullName: "Updated User" }
  });

  assert.equal(nextError, undefined);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.fullName, "Updated User");
});

test("updateUserAdmin returns updated user", async () => {
  let findByIdCalls = 0;
  mock.method(User, "findById", () => {
    findByIdCalls += 1;

    if (findByIdCalls === 1) {
      return {
        select: async () => ({
          _id: "u12",
          email: "old@example.com",
          fullName: "Old",
          save: async () => {}
        })
      };
    }

    return {
      select: async () => ({ _id: "u12", fullName: "New Name" })
    };
  });

  const { res, nextError } = await invoke(updateUserAdmin, {
    params: { id: "u12" },
    body: { fullName: "New Name" }
  });

  assert.equal(nextError, undefined);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.fullName, "New Name");
});

test("deleteUserAdmin blocks self-deactivation", async () => {
  const { nextError } = await invoke(deleteUserAdmin, {
    user: { _id: { toString: () => "u4" } },
    params: { id: "u4" }
  });

  assert.ok(nextError);
  assert.equal(nextError.statusCode, 400);
  assert.equal(nextError.code, "SELF_DEACTIVATE_BLOCKED");
});

test("deleteUserAdmin returns deactivated user", async () => {
  let findByIdCalls = 0;
  mock.method(User, "findById", () => {
    findByIdCalls += 1;
    if (findByIdCalls === 1) {
      return {
        _id: "u13",
        isActive: true,
        save: async () => {}
      };
    }

    return {
      select: async () => ({ _id: "u13", isActive: false })
    };
  });

  const { res, nextError } = await invoke(deleteUserAdmin, {
    user: { _id: { toString: () => "admin-1" } },
    params: { id: "u13" }
  });

  assert.equal(nextError, undefined);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.isActive, false);
});
