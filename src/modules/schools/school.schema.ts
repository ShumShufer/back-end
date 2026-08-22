import { z } from "zod";
import {
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_DEFAULT_PAGE_SIZE,
  PAGINATION_MAX_PAGE_SIZE,
} from "../../shared/config/constants.js";

/**
 * Schema for creating a new school (SUPER_ADMIN)
 */
export const createSchoolSchema = z.object({
  name: z
    .string()
    .min(2, "School name must be at least 2 characters")
    .max(100, "School name must not exceed 100 characters"),
  description: z.string().max(1000, "Description too long").optional(),
});

/**
 * Schema for updating school profile (ADMIN, SUPER_ADMIN)
 */
export const updateSchoolSchema = z.object({
  name: z
    .string()
    .min(2, "School name must be at least 2 characters")
    .max(100, "School name must not exceed 100 characters")
    .optional(),
  description: z.string().max(1000, "Description too long").optional(),
});

/**
 * Schema for updating school status (SUPER_ADMIN)
 */
export const updateSchoolStatusSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "PENDING_APPROVAL"]),
});

/**
 * Schema for querying/filtering schools list (Public)
 */
export const querySchoolsSchema = z.object({
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
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "PENDING_APPROVAL"]).optional(),
});

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;
export type UpdateSchoolStatusInput = z.infer<typeof updateSchoolStatusSchema>;
export type QuerySchoolsInput = z.infer<typeof querySchoolsSchema>;
