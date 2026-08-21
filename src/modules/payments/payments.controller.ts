import type { Request, Response, NextFunction } from "express";
import * as paymentsService from "./payments.service.js";
import type { AuthUser } from "../../shared/types/auth.types.js";
import type {
  InitiatePaymentInput,
  QueryPaymentsInput,
} from "./payments.schema.js";

/**
 * POST /payments/initiate
 */
export async function initiatePayment(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await paymentsService.initiatePayment(
      req.body as InitiatePaymentInput,
      req.user as AuthUser,
    );
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /payments/verify/:txRef
 */
export async function verifyPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const { txRef } = req.params;
    const payment = await paymentsService.verifyPayment(txRef as string);
    res.json(payment);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /payments/webhook
 */
export async function handleWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const signature = req.headers["x-chapa-signature"] as string | undefined;
    const rawBody = JSON.stringify(req.body);
    const result = await paymentsService.handleChapaWebhook(signature, rawBody, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /payments
 */
export async function getPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await paymentsService.getPayments(
      req.query as unknown as QueryPaymentsInput,
      req.user as AuthUser,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /schools/:id/revenue
 */
export async function getSchoolRevenue(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const revenue = await paymentsService.getSchoolRevenue(id as string, req.user as AuthUser);
    res.json(revenue);
  } catch (err) {
    next(err);
  }
}
