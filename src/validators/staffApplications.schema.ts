import { z } from "zod";
import {
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_DEFAULT_PAGE_SIZE,
  PAGINATION_MAX_PAGE_SIZE,
} from "../config/constants.js";

/**
 * Schema for creating a staff job post (ADMIN).
 * role defines what position is being advertised (MENTOR, EDUCATION_HEAD, etc.)
 */
export const createStaffPostSchema = z.object({
  // z.enum in Zod v4 requires a native enum — use union of literals for string unions
  role: z.union([z.literal("MENTOR"), z.literal("EDUCATION_HEAD")]),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must not exceed 2000 characters"),
});

/**
 * Schema for updating a staff post (ADMIN).
 * Status can be toggled between OPEN and CLOSED to control visibility.
 */
export const updateStaffPostSchema = z.object({
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must not exceed 2000 characters")
    .optional(),
  status: z.enum(["OPEN", "CLOSED"]).optional(),
});

/**
 * Schema for querying staff posts — supports filtering by role and open/closed status.
 */
export const queryStaffPostsSchema = z.object({
  role: z.enum(["MENTOR", "EDUCATION_HEAD"]).optional(),
  status: z.enum(["OPEN", "CLOSED"]).optional(),
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

/**
 * Schema for submitting a staff application to a post.
 * resumeUrl is optional — applicants may not always have a hosted resume.
 */
export const submitStaffApplicationSchema = z.object({
  resumeUrl: z
    .string()
    .url("Resume URL must be a valid URL")
    .optional(),
});

/**
 * Schema for querying the staff applications inbox (ADMIN).
 */
export const queryStaffApplicationsSchema = z.object({
  status: z
    .enum(["PENDING", "ACCEPTED", "REJECTED"])
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

export type CreateStaffPostInput = z.infer<typeof createStaffPostSchema>;
export type UpdateStaffPostInput = z.infer<typeof updateStaffPostSchema>;
export type QueryStaffPostsInput = z.infer<typeof queryStaffPostsSchema>;
export type SubmitStaffApplicationInput = z.infer<typeof submitStaffApplicationSchema>;
export type QueryStaffApplicationsInput = z.infer<typeof queryStaffApplicationsSchema>;
