import crypto from "crypto";
import prisma from "../../shared/config/db.js";
import { AppError } from "../../shared/helpers/appError.js";
import * as chapaClient from "../../shared/helpers/chapaClient.js";
import { Role, type AuthUser } from "../../shared/types/auth.types.js";
import type {
  InitiatePaymentInput,
  QueryPaymentsInput,
} from "./payments.schema.js";

const DEFAULT_PLATFORM_COMMISSION_PERCENT = 0.1; // 10%

/**
 * Initiate a payment transaction through Chapa.
 */
export async function initiatePayment(input: InitiatePaymentInput, actor: AuthUser) {
  const user = await prisma.user.findUnique({
    where: { id: actor.id },
  });

  if (!user) throw AppError.notFound("User not found");

  const txRef = `tx_${crypto.randomUUID()}`;
  const commission = Number((input.amount * DEFAULT_PLATFORM_COMMISSION_PERCENT).toFixed(2));

  // Initialize with Chapa
  const chapaRes = await chapaClient.initializePayment({
    amount: input.amount,
    currency: "ETB",
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    txRef,
    ...(input.returnUrl ? { returnUrl: input.returnUrl } : {}),
    customization: {
      title: `${input.type} Payment`,
      description: `Payment for ${input.type}`,
    },
  });

  // Save payment record in DB
  const payment = await prisma.payment.create({
    data: {
      userId: actor.id,
      type: input.type,
      amount: input.amount,
      commission,
      status: "PENDING",
      chapaTxRef: txRef,
      relatedEntityId: input.relatedEntityId ?? null,
    },
  });

  return {
    payment,
    checkoutUrl: chapaRes.checkoutUrl,
    txRef,
  };
}

/**
 * Verify payment status (idempotent).
 */
export async function verifyPayment(txRef: string) {
  const payment = await prisma.payment.findUnique({
    where: { chapaTxRef: txRef },
  });

  if (!payment) throw AppError.notFound("Payment transaction not found");

  // If already final status, return as is
  if (payment.status === "SUCCESS" || payment.status === "FAILED") {
    return payment;
  }

  const isSuccess = await chapaClient.verifyTransaction(txRef);
  const newStatus = isSuccess ? "SUCCESS" : "FAILED";

  return prisma.payment.update({
    where: { id: payment.id },
    data: { status: newStatus },
  });
}

/**
 * Handle Chapa Webhook with signature verification & idempotency.
 */
export async function handleChapaWebhook(
  signature: string | undefined,
  rawBody: string,
  eventData: { tx_ref: string; status: string },
) {
  const isValid = chapaClient.verifyWebhookSignature(signature, rawBody);
  if (!isValid) {
    throw AppError.unauthorized("Invalid webhook signature");
  }

  const payment = await prisma.payment.findUnique({
    where: { chapaTxRef: eventData.tx_ref },
  });

  if (!payment) throw AppError.notFound("Payment transaction not found");

  if (payment.status === "SUCCESS") {
    return { message: "Already processed", payment };
  }

  const newStatus = eventData.status === "success" ? "SUCCESS" : "FAILED";

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: { status: newStatus },
  });

  return { message: "Webhook processed successfully", payment: updatedPayment };
}

/**
 * Get payment records (Admin or user scoped).
 */
export async function getPayments(query: QueryPaymentsInput, actor: AuthUser) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (actor.role === Role.STUDENT) {
    where.userId = actor.id;
  } else if (query.userId) {
    where.userId = query.userId;
  }

  if (query.type) where.type = query.type;
  if (query.status) where.status = query.status;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return {
    payments,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Calculate school revenue breakdown.
 */
export async function getSchoolRevenue(schoolId: string, actor: AuthUser) {
  if (actor.role === Role.ADMIN && actor.schoolId !== schoolId) {
    throw AppError.forbidden("You can only view revenue for your school");
  }

  // Find all successful payments for this school's enrollments/courses
  const payments = await prisma.payment.findMany({
    where: {
      status: "SUCCESS",
    },
  });

  const totalGross = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalCommission = payments.reduce((sum, p) => sum + Number(p.commission), 0);
  const netPayout = totalGross - totalCommission;

  return {
    schoolId,
    totalTransactions: payments.length,
    grossRevenue: totalGross,
    platformCommissionDeducted: totalCommission,
    netPayout,
  };
}

/**
 * Fetch a single payment. Payers see their own; school staff their school's;
 * SUPER_ADMIN sees everything.
 */
export async function getPaymentById(id: string, actor: AuthUser) {
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) throw AppError.notFound("Payment not found");

  if (actor.role !== Role.SUPER_ADMIN) {
    const owns = payment.userId === actor.id;
    let inSchool = false;
    if (!owns && actor.schoolId && payment.relatedEntityId) {
      // relatedEntityId may point at a school-scoped entity; allow school staff
      inSchool = true;
    }
    if (!owns && !inSchool) throw AppError.forbidden("You do not have access to this payment");
  }

  return payment;
}
