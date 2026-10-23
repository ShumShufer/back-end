import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import {
  initializePayment,
  verifyTransaction,
  verifyWebhookSignature,
} from "../../src/shared/helpers/chapaClient.js";

describe("Chapa Payment Gateway Client Tests", () => {
  it("should initialize payment and return a checkout URL", async () => {
    const result = await initializePayment({
      amount: 1500,
      currency: "ETB",
      email: "test@example.com",
      firstName: "Abebe",
      lastName: "Bikila",
      txRef: "TX-TEST-123456",
    });

    assert.ok(result.checkoutUrl);
    assert.equal(result.txRef, "TX-TEST-123456");
    assert.ok(result.checkoutUrl.includes("TX-TEST-123456"));
  });

  it("should verify transaction in test mode", async () => {
    const verified = await verifyTransaction("TX-TEST-123456");
    assert.equal(verified, true);
  });

  it("should verify HMAC webhook signature correctly", () => {
    const secret = "custom_test_secret";
    process.env.CHAPA_WEBHOOK_SECRET = secret;

    const payload = JSON.stringify({
      tx_ref: "TX-123",
      status: "success",
      amount: "1500",
    });

    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    assert.equal(verifyWebhookSignature(validSignature, payload), true);
    assert.equal(verifyWebhookSignature("invalid_signature", payload), false);
    assert.equal(verifyWebhookSignature(undefined, payload), false);
  });
});
