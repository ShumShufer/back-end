import { Router } from "express";
import * as branchesController from "../controllers/branches.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { scopeToSchool } from "../middlewares/scopeToSchool.js";
import { validate } from "../middlewares/validate.js";
import {
  createBranchSchema,
  updateBranchSchema,
  queryNearbyBranchesSchema,
} from "../validators/branch.schema.js";
import { Role } from "../types/auth.types.js";

/**
 * Standalone branch router — mounted at /branches
 * Handles GET/PATCH/DELETE on a single branch by its own ID
 */
const router = Router();

// GET /branches/nearby — public geographic search by lat/lng/radius
// Must be defined before /:id to prevent "nearby" being treated as a branch ID
router.get(
  "/nearby",
  validate(queryNearbyBranchesSchema, "query"),
  branchesController.getNearbyBranches,
);

// GET /branches/:id — public, full branch detail with parent school info
router.get("/:id", branchesController.getBranchById);

// PATCH /branches/:id — ADMIN only; scopeToSchool enforces same-school constraint
router.patch(
  "/:id",
  authenticate,
  authorize(Role.ADMIN),
  scopeToSchool,
  validate(updateBranchSchema),
  branchesController.updateBranch,
);

// DELETE /branches/:id — ADMIN only; scopeToSchool enforces same-school constraint
router.delete(
  "/:id",
  authenticate,
  authorize(Role.ADMIN),
  scopeToSchool,
  branchesController.deleteBranch,
);

export default router;

/**
 * School-nested branch router — mounted at /schools/:id/branches (mergeParams: true)
 * Handles listing and creating branches under a specific school
 */
export const schoolBranchRouter = Router({ mergeParams: true });

// GET /schools/:id/branches — public list of branches for a school
schoolBranchRouter.get("/", branchesController.getBranchesBySchoolId);

// POST /schools/:id/branches — ADMIN only, creates a branch under this school
// scopeToSchool resolves the parent school ID to enforce school ownership
schoolBranchRouter.post(
  "/",
  authenticate,
  authorize(Role.ADMIN),
  scopeToSchool,
  validate(createBranchSchema),
  branchesController.createBranch,
);
