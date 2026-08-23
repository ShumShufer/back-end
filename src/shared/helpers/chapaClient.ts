import crypto from "crypto";

export interface InitializePaymentParams {
  amount: number;
  currency?: string;
  email: string;
  firstName: string;
  lastName: string;
  txRef: string;
  callbackUrl?: string;
  returnUrl?: string;
  customization?: {
    title?: string;
    description?: string;
  };
}

export interface ChapaInitResponse {
  status: string;
  message: string;
  data: {
    checkout_url: string;
  };
}

export interface ChapaVerifyResponse {
  status: string;
  message: string;
  data: {
    amount: number;
    currency: string;
    status: string;
    tx_ref: string;
  };
}

const CHAPA_API_URL = process.env.CHAPA_API_URL || "https://api.chapa.co/v1";
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || "CHASECK_TEST-mock";
const CHAPA_WEBHOOK_SECRET = process.env.CHAPA_WEBHOOK_SECRET || "chapa_secret";

/**
 * Initialize payment with Chapa Gateway.
 * If running in development/mock mode without live keys, returns a simulated checkout URL.
 */
export async function initializePayment(params: InitializePaymentParams): Promise<{ checkoutUrl: string; txRef: string }> {
  if (CHAPA_SECRET_KEY.includes("mock") || CHAPA_SECRET_KEY.includes("TEST")) {
    return {
      checkoutUrl: `https://checkout.chapa.co/checkout/payment/${params.txRef}`,
      txRef: params.txRef,
    };
  }

  const response = await fetch(`${CHAPA_API_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amount.toString(),
      currency: params.currency || "ETB",
      email: params.email,
      first_name: params.firstName,
      last_name: params.lastName,
      tx_ref: params.txRef,
      callback_url: params.callbackUrl,
      return_url: params.returnUrl,
      customization: params.customization,
    }),
  });

  const data = (await response.json()) as ChapaInitResponse;
  if (data.status !== "success") {
    throw new Error(data.message || "Failed to initialize Chapa payment");
  }

  return {
    checkoutUrl: data.data.checkout_url,
    txRef: params.txRef,
  };
}

/**
 * Verify transaction status with Chapa API.
 */
export async function verifyTransaction(txRef: string): Promise<boolean> {
  if (CHAPA_SECRET_KEY.includes("mock") || CHAPA_SECRET_KEY.includes("TEST")) {
    return true;
  }

  const response = await fetch(`${CHAPA_API_URL}/transaction/verify/${txRef}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
    },
  });

  const data = (await response.json()) as ChapaVerifyResponse;
  return data.status === "success" && data.data.status === "success";
}

/**
 * Verify Chapa Webhook HMAC signature.
 */
export function verifyWebhookSignature(signature: string | undefined, rawBody: string): boolean {
  if (!signature) return false;
  if (CHAPA_WEBHOOK_SECRET === "chapa_secret") return true; // dev fallback

  const expectedHash = crypto
    .createHmac("sha256", CHAPA_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");

  return signature === expectedHash;
}
