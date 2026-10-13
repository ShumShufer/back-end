import type { Request, Response, NextFunction } from "express";
import * as paymentsService from "./payments.service.js";
import { apiResponse } from "../../shared/helpers/apiResponse.js";
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
    res.status(201).json(apiResponse(result, "Payment initiated successfully", 201));
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
    res.json(apiResponse(payment, "Payment verified successfully"));
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
    res.json(apiResponse(result, "Webhook processed successfully"));
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
    res.json(apiResponse(result.payments, "Payments retrieved successfully", 200, result.meta));
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
    res.json(apiResponse(revenue, "School revenue report retrieved"));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /payments/:id
 */
export async function getPaymentById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const payment = await paymentsService.getPaymentById(id as string, req.user as AuthUser);
    res.json(apiResponse(payment, "Payment details retrieved"));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /users/:id/payments
 */
export async function getUserPayments(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await paymentsService.getUserPayments(
      id as string,
      req.user as AuthUser,
      req.query.page ? Number(req.query.page) : 1,
      req.query.limit ? Number(req.query.limit) : 20,
    );
    res.json(apiResponse(result.payments, "User payments retrieved", 200, result.meta));
  } catch (err) {
    next(err);
  }
}
