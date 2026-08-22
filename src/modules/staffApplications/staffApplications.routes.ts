import { Router } from "express";
import * as staffApplicationsController from "./staffApplications.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { authorize } from "../../shared/middlewares/authorize.js";
import { scopeToSchool } from "../../shared/middlewares/scopeToSchool.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  createStaffPostSchema,
  updateStaffPostSchema,
  queryStaffPostsSchema,
  submitStaffApplicationSchema,
  queryStaffApplicationsSchema,
} from "./staffApplications.schema.js";
import { Role } from "../../shared/types/auth.types.js";

/**
 * Staff posts router — mounted at /staff-posts
 * Public browsing of job listings + applying and managing individual posts
 */
const router = Router();

// GET /staff-posts — public list of open staff positions (defaults to OPEN in service)
router.get(
  "/",
  validate(queryStaffPostsSchema, "query"),
  staffApplicationsController.getStaffPosts,
);

// GET /staff-posts/:id — public view of a single staff post detail
router.get("/:id", staffApplicationsController.getStaffPostById);

// PATCH /staff-posts/:id — ADMIN updates description or opens/closes the post
// scopeToSchool ensures only the school that owns this post can update it
router.patch(
  "/:id",
  authenticate,
  authorize(Role.ADMIN),
  scopeToSchool,
  validate(updateStaffPostSchema),
  staffApplicationsController.updateStaffPost,
);

// POST /staff-posts/:id/apply — any authenticated user submits an application
router.post(
  "/:id/apply",
  authenticate,
  validate(submitStaffApplicationSchema),
  staffApplicationsController.submitStaffApplication,
);

export default router;

/**
 * Staff applications router — mounted at /staff-applications
 * Handles accept/reject actions on individual applications by their own ID
 */
export const staffApplicationActionsRouter = Router();

// PATCH /staff-applications/:id/accept — ADMIN accepts; promotes applicant's role
staffApplicationActionsRouter.patch(
  "/:id/accept",
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  scopeToSchool,
  staffApplicationsController.acceptStaffApplication,
);

// PATCH /staff-applications/:id/reject — ADMIN rejects and notifies applicant
staffApplicationActionsRouter.patch(
  "/:id/reject",
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  scopeToSchool,
  staffApplicationsController.rejectStaffApplication,
);

/**
 * School-nested staff router — mounted at /schools/:id (mergeParams: true)
 * Handles creating posts and viewing the applications inbox under a specific school
 */
export const schoolStaffRouter = Router({ mergeParams: true });

// GET /schools/:id/staff-posts — ADMIN views all their own posts (any status)
schoolStaffRouter.get(
  "/staff-posts",
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  scopeToSchool,
  validate(queryStaffPostsSchema, "query"),
  staffApplicationsController.getStaffPostsBySchool,
);

// POST /schools/:id/staff-posts — ADMIN creates a new job opening for their school
schoolStaffRouter.post(
  "/staff-posts",
  authenticate,
  authorize(Role.ADMIN),
  scopeToSchool,
  validate(createStaffPostSchema),
  staffApplicationsController.createStaffPost,
);

// GET /schools/:id/staff-applications — ADMIN views all applications across their posts
schoolStaffRouter.get(
  "/staff-applications",
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  scopeToSchool,
  validate(queryStaffApplicationsSchema, "query"),
  staffApplicationsController.getStaffApplicationsBySchool,
);
