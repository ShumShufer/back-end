import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, comparePassword } from "../../src/shared/helpers/password.js";
import { verifyWithFayda } from "../../src/shared/helpers/faydaClient.js";

describe("Auth & Identity Unit Tests", () => {
  it("should securely hash a password and correctly verify it", async () => {
    const raw = "SuperSecretPassword123!";
    const hashed = await hashPassword(raw);

    assert.notEqual(hashed, raw);
    assert.ok(hashed.length > 20);

    const matches = await comparePassword(raw, hashed);
    assert.equal(matches, true);

    const wrongMatches = await comparePassword("WrongPassword123", hashed);
    assert.equal(wrongMatches, false);
  });

  it("should verify valid Fayda test IDs", async () => {
    const result = await verifyWithFayda("FAY-123456");
    assert.equal(result.success, true);
    assert.equal(result.verified, true);
    assert.equal(result.fullName, "John Doe");
    assert.equal(result.idNumber, "FAY-123456");
  });

  it("should verify valid Ethiopian phone numbers with mock Fayda records", async () => {
    const result = await verifyWithFayda("0911223344");
    assert.equal(result.success, true);
    assert.equal(result.verified, true);
    assert.equal(result.fullName, "John Doe");
  });

  it("should reject invalid / empty Fayda identifiers", async () => {
    const result = await verifyWithFayda("12");
    assert.equal(result.success, false);
    assert.equal(result.verified, false);
    assert.ok(result.error);
  });
});
