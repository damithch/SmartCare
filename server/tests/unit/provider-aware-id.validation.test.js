import test from "node:test";
import assert from "node:assert/strict";
import { createProviderAwareIdSchema } from "../../src/validators/uuid.validation.js";

test("provider-aware id schema accepts Mongo ObjectId by default", () => {
  delete process.env.DATABASE_PROVIDER;

  const schema = createProviderAwareIdSchema("Invalid ID format", "ID is required");
  const { error, value } = schema.validate("507f1f77bcf86cd799439011");

  assert.equal(error, undefined);
  assert.equal(value, "507f1f77bcf86cd799439011");
});

test("provider-aware id schema rejects UUID values in Mongo mode", () => {
  delete process.env.DATABASE_PROVIDER;

  const schema = createProviderAwareIdSchema("Invalid ID format", "ID is required");
  const { error } = schema.validate("550e8400-e29b-41d4-a716-446655440000");

  assert.ok(error);
  assert.equal(error.details[0].message, "Invalid ID format");
});

test("provider-aware id schema accepts UUID values in Postgres mode", () => {
  process.env.DATABASE_PROVIDER = "postgres";

  const schema = createProviderAwareIdSchema("Invalid ID format", "ID is required");
  const { error, value } = schema.validate("550e8400-e29b-41d4-a716-446655440000");

  assert.equal(error, undefined);
  assert.equal(value, "550e8400-e29b-41d4-a716-446655440000");
});

test("provider-aware id schema rejects Mongo ObjectIds in Postgres mode", () => {
  process.env.DATABASE_PROVIDER = "postgres";

  const schema = createProviderAwareIdSchema("Invalid ID format", "ID is required");
  const { error } = schema.validate("507f1f77bcf86cd799439011");

  assert.ok(error);
  assert.equal(error.details[0].message, "Invalid ID format");
});
