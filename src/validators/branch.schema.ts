import { z } from "zod";

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

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
