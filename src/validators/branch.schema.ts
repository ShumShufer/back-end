import { z } from "zod";
import {
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_DEFAULT_PAGE_SIZE,
  PAGINATION_MAX_PAGE_SIZE,
} from "../config/constants.js";

/**
 * Schema for creating a new branch under a school (ADMIN)
 */
export const createBranchSchema = z.object({
  name: z
    .string()
    .min(2, "Branch name must be at least 2 characters")
    .max(100, "Branch name must not exceed 100 characters"),
  address: z
    .string()
    .min(3, "Address must be at least 3 characters")
    .max(255, "Address must not exceed 255 characters"),
  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
});

/**
 * Schema for updating an existing branch (ADMIN)
 */
export const updateBranchSchema = z.object({
  name: z
    .string()
    .min(2, "Branch name must be at least 2 characters")
    .max(100, "Branch name must not exceed 100 characters")
    .optional(),
  address: z
    .string()
    .min(3, "Address must be at least 3 characters")
    .max(255, "Address must not exceed 255 characters")
    .optional(),
  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional(),
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional(),
});

/**
 * Schema for querying branches by geographic proximity.
 * radius is in kilometers, defaults to 10km, capped at 100km.
 * Query params come in as strings from Express, so we validate then transform.
 */
export const queryNearbyBranchesSchema = z.object({
  lat: z
    .string({ error: "Latitude is required" })
    .superRefine((val, ctx) => {
      const n = parseFloat(val);
      if (isNaN(n) || n < -90 || n > 90) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ctx.addIssue({ code: "custom" as any, message: "Latitude must be a number between -90 and 90" });
      }
    })
    .transform((val) => parseFloat(val)),
  lng: z
    .string({ error: "Longitude is required" })
    .superRefine((val, ctx) => {
      const n = parseFloat(val);
      if (isNaN(n) || n < -180 || n > 180) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ctx.addIssue({ code: "custom" as any, message: "Longitude must be a number between -180 and 180" });
      }
    })
    .transform((val) => parseFloat(val)),
  radius: z
    .string()
    .optional()
    .default("10")
    .transform((val) => Math.min(100, Math.max(1, parseFloat(val) || 10))),
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

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
export type QueryNearbyBranchesInput = z.infer<typeof queryNearbyBranchesSchema>;
