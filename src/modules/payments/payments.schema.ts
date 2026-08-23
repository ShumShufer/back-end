import { z } from "zod";

export const initiatePaymentSchema = z.object({
  type: z.enum(["ENROLLMENT", "COURSE_PURCHASE", "PRACTICE_ELSEWHERE_FEE"]),
  amount: z.number().positive(),
  relatedEntityId: z.string().uuid().optional(),
  returnUrl: z.string().url().optional(),
});

export const queryPaymentsSchema = z.object({
  userId: z.string().uuid().optional(),
  type: z.enum(["ENROLLMENT", "COURSE_PURCHASE", "PRACTICE_ELSEWHERE_FEE"]).optional(),
  status: z.enum(["PENDING", "SUCCESS", "FAILED", "REFUNDED"]).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;
export type QueryPaymentsInput = z.infer<typeof queryPaymentsSchema>;
