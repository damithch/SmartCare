import test, { afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import User from "../../../src/models/user.model.js";
import {
  createUserByAdmin,
  deleteUserByAdmin,
  getAllUsers,
  updateMyProfile,
  updateUserByAdmin
} from "../../../src/services/user.service.js";

afterEach(() => {
  mock.restoreAll();
});

test("getAllUsers applies pagination and returns metadata", async () => {
  let receivedQuery;

  mock.method(User, "find", (query) => {
    receivedQuery = query;
    return {
      select() {
        return this;
      },
      sort() {
        return this;
      },
      skip() {
        return this;
      },
      limit: async () => [{ _id: "u1" }]
    };
  });
  mock.method(User, "countDocuments", async () => 1);

  const result = await getAllUsers({
    page: "1",
    limit: "10",
    search: "john",
    role: "doctor",
    isActive: "true",
    sortBy: "createdAt",
    sortOrder: "desc"
  });

  assert.deepEqual(receivedQuery, {
    $or: [
      { fullName: { $regex: "john", $options: "i" } },
      { email: { $regex: "john", $options: "i" } }
    ],
    role: "doctor",
    isActive: true
  });
  assert.equal(result.users.length, 1);
  assert.equal(result.pagination.total, 1);
});

test("updateMyProfile rejects disallowed role", async () => {
  await assert.rejects(
    updateMyProfile("u1", "admin", { fullName: "X" }),
    (error) => error.code === "FORBIDDEN_PROFILE_UPDATE"
  );
});

test("updateMyProfile rejects disallowed fields for nurse", async () => {
  await assert.rejects(
    updateMyProfile("u1", "nurse", { email: "nurse@h.com" }),
    (error) => error.code === "FORBIDDEN_PROFILE_FIELDS"
  );
});

test("updateMyProfile rejects empty payload", async () => {
  await assert.rejects(
    updateMyProfile("u1", "patient", {}),
    (error) => error.code === "VALIDATION_ERROR"
  );
});

test("updateMyProfile rejects duplicate email", async () => {
  mock.method(User, "findById", () => ({
    select: async () => ({
      _id: "u1",
      email: "old@example.com",
      save: async () => {}
    })
  }));
  mock.method(User, "findOne", async () => ({ _id: "dup" }));

  await assert.rejects(
    updateMyProfile("u1", "patient", { email: "dup@example.com" }),
    (error) => error.code === "DUPLICATE_EMAIL"
  );
});

test("updateMyProfile updates and returns sanitized user", async () => {
  let findByIdCalls = 0;
  const userDoc = {
    _id: "u1",
    email: "old@example.com",
    fullName: "Old",
    save: async () => {}
  };

  mock.method(User, "findById", () => {
    findByIdCalls += 1;
    if (findByIdCalls === 1) {
      return { select: async () => userDoc };
    }

    return {
      select: async () => ({
        _id: "u1",
        fullName: "New",
        email: "new@example.com",
        role: "patient"
      })
    };
  });
  mock.method(User, "findOne", async () => null);

  const result = await updateMyProfile("u1", "patient", {
    fullName: "New",
    email: "new@example.com"
  });

  assert.equal(result.fullName, "New");
  assert.equal(result.email, "new@example.com");
});

test("createUserByAdmin rejects duplicate email", async () => {
  mock.method(User, "findOne", async () => ({ _id: "u1" }));

  await assert.rejects(
    createUserByAdmin({
      fullName: "A",
      email: "a@example.com",
      password: "abc123",
      role: "patient"
    }),
    (error) => error.code === "DUPLICATE_EMAIL"
  );
});

test("createUserByAdmin creates and returns user", async () => {
  mock.method(User, "findOne", async () => null);
  mock.method(User, "create", async () => ({ _id: "u2" }));
  mock.method(User, "findById", () => ({
    select: async () => ({ _id: "u2", fullName: "Created" })
  }));

  const result = await createUserByAdmin({
    fullName: "Created",
    email: "created@example.com",
    password: "abc123",
    role: "doctor"
  });

  assert.equal(result._id, "u2");
});

test("updateUserByAdmin rejects when user does not exist", async () => {
  mock.method(User, "findById", () => ({
    select: async () => null
  }));

  await assert.rejects(
    updateUserByAdmin("missing", { fullName: "X" }),
    (error) => error.code === "USER_NOT_FOUND"
  );
});

test("updateUserByAdmin rejects duplicate email", async () => {
  mock.method(User, "findById", () => ({
    select: async () => ({
      _id: "u3",
      email: "old@example.com",
      save: async () => {}
    })
  }));
  mock.method(User, "findOne", async () => ({ _id: "dup" }));

  await assert.rejects(
    updateUserByAdmin("u3", { email: "dup@example.com" }),
    (error) => error.code === "DUPLICATE_EMAIL"
  );
});

test("updateUserByAdmin updates user", async () => {
  let findByIdCalls = 0;
  const userDoc = {
    _id: "u4",
    email: "old@example.com",
    fullName: "Old",
    save: async () => {}
  };

  mock.method(User, "findById", () => {
    findByIdCalls += 1;
    if (findByIdCalls === 1) {
      return { select: async () => userDoc };
    }

    return {
      select: async () => ({ _id: "u4", fullName: "Updated" })
    };
  });
  mock.method(User, "findOne", async () => null);

  const result = await updateUserByAdmin("u4", { fullName: "Updated" });
  assert.equal(result.fullName, "Updated");
});

test("deleteUserByAdmin rejects when user does not exist", async () => {
  mock.method(User, "findById", async () => null);

  await assert.rejects(
    deleteUserByAdmin("missing"),
    (error) => error.code === "USER_NOT_FOUND"
  );
});

test("deleteUserByAdmin soft-deletes user", async () => {
  let findByIdCalls = 0;
  const userDoc = {
    _id: "u5",
    isActive: true,
    save: async () => {}
  };

  mock.method(User, "findById", () => {
    findByIdCalls += 1;
    if (findByIdCalls === 1) {
      return userDoc;
    }

    return {
      select: async () => ({ _id: "u5", isActive: false })
    };
  });

  const result = await deleteUserByAdmin("u5");
  assert.equal(userDoc.isActive, false);
  assert.equal(result.isActive, false);
});
