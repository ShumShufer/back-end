import { Router } from "express";
import * as schoolsController from "./schools.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { authorize } from "../../shared/middlewares/authorize.js";
import { scopeToSchool } from "../../shared/middlewares/scopeToSchool.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  createSchoolSchema,
  updateSchoolSchema,
  updateSchoolStatusSchema,
  querySchoolsSchema,
} from "./school.schema.js";
import { Role } from "../../shared/types/auth.types.js";

const router = Router();

/**
 * Public routes — no authentication required
 */

// GET /schools — paginated, searchable list of all schools
router.get(
  "/",
  validate(querySchoolsSchema, "query"),
  schoolsController.getAllSchools,
);

// GET /schools/:id — full school profile with branches and course list
router.get("/:id", schoolsController.getSchoolById);

/**
 * Protected routes — authentication required
 */

// POST /schools — create a new school; SUPER_ADMIN only
router.post(
  "/",
  authenticate,
  authorize(Role.SUPER_ADMIN),
  validate(createSchoolSchema),
  schoolsController.createSchool,
);

// PATCH /schools/:id — update school name/description; SUPER_ADMIN or ADMIN
// scopeToSchool ensures an ADMIN can only update their own school
router.patch(
  "/:id",
  authenticate,
  authorize(Role.SUPER_ADMIN, Role.ADMIN),
  scopeToSchool,
  validate(updateSchoolSchema),
  schoolsController.updateSchool,
);

// PATCH /schools/:id/status — change ACTIVE/SUSPENDED/PENDING; SUPER_ADMIN only
router.patch(
  "/:id/status",
  authenticate,
  authorize(Role.SUPER_ADMIN),
  validate(updateSchoolStatusSchema),
  schoolsController.updateSchoolStatus,
);

// GET /schools/:id/stats — aggregated counts; any authenticated user scoped to that school
router.get(
  "/:id/stats",
  authenticate,
  scopeToSchool,
  schoolsController.getSchoolStats,
);

export default router;
