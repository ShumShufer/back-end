import { z } from "zod";
import {
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_DEFAULT_PAGE_SIZE,
  PAGINATION_MAX_PAGE_SIZE,
} from "../../shared/config/constants.js";

/**
 * Schema for a student submitting an enrollment application to a school.
 * formResponses is a flexible JSON object because each school defines
 * its own ApplicationFormTemplate fields — we cannot statically type them here.
 */
export const submitApplicationSchema = z.object({
  // z.enum in Zod v4 requires a native enum or object literal — use union of literals for string unions
  mode: z.union([z.literal("ONLINE"), z.literal("IN_PERSON")]),
  // z.record in Zod v4 requires explicit key + value types
  formResponses: z
    .record(z.string(), z.unknown())
    .refine((val) => Object.keys(val).length > 0, {
      message: "Form responses cannot be empty",
    }),
});

/**
 * Schema for an admin accepting an application.
 * classroomId is required — accepting an application must assign the student
 * to a specific classroom immediately (per business rule in TIMELINE_AND_TASKS.md).
 */
export const acceptApplicationSchema = z.object({
  classroomId: z.string().uuid("Invalid classroom ID format"),
});

/**
 * Schema for an admin rejecting an application.
 * A rejection reason is optional but encouraged for good UX on the student side.
 */
export const rejectApplicationSchema = z.object({
  reason: z.string().max(500, "Rejection reason must not exceed 500 characters").optional(),
});

/**
 * Schema for setting or updating a school's application form template.
 * fields is a JSON array of field definitions (label, type, required, etc.)
 * The shape of each field object is controlled by the frontend form builder.
 */
export const upsertFormTemplateSchema = z.object({
  fields: z
    .array(z.record(z.string(), z.unknown()))
    .min(1, "Form template must have at least one field"),
});

/**
 * Schema for query params when listing applications for a school (admin inbox).
 */
export const queryApplicationsSchema = z.object({
  status: z
    .enum(["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN"])
    .optional(),
  page: z
    .string()
    .optional()
    .default(String(PAGINATION_DEFAULT_PAGE))
    .transform((val) => Math.max(1, parseInt(val, 10) || PAGINATION_DEFAULT_PAGE)),
  pageSize: z
    .string()
    .optional()
    .default(String(PAGINATION_DEFAULT_PAGE_SIZE))
    .transform((val) =>
      Math.min(PAGINATION_MAX_PAGE_SIZE, Math.max(1, parseInt(val, 10) || PAGINATION_DEFAULT_PAGE_SIZE)),
    ),
});

export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>;
export type AcceptApplicationInput = z.infer<typeof acceptApplicationSchema>;
export type RejectApplicationInput = z.infer<typeof rejectApplicationSchema>;
export type UpsertFormTemplateInput = z.infer<typeof upsertFormTemplateSchema>;
export type QueryApplicationsInput = z.infer<typeof queryApplicationsSchema>;
