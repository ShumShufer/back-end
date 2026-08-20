import { Router } from "express";
import * as paymentsController from "../controllers/payments.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import { initiatePaymentSchema, queryPaymentsSchema } from "../validators/payments.schema.js";

const router = Router();

/**
 * POST /payments/initiate — Initiate a payment via Chapa
 * Any authenticated user can initiate (student purchasing, enrolling, etc.)
 */
router.post(
  "/initiate",
  authenticate,
  validate(initiatePaymentSchema),
  paymentsController.initiatePayment,
);

/**
 * GET /payments/verify/:txRef — Verify a payment by transaction reference
 */
router.get(
  "/verify/:txRef",
  authenticate,
  paymentsController.verifyPayment,
);

/**
 * POST /payments/webhook — Chapa webhook (no auth, HMAC verified in service)
 */
router.post("/webhook", paymentsController.handleWebhook);

/**
 * GET /payments — List payments (admin sees all, student sees own)
 */
router.get(
  "/",
  authenticate,
  validate(queryPaymentsSchema, "query"),
  paymentsController.getPayments,
);

export default router;
