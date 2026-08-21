import { Router } from "express";
import * as enrollmentsController from "./enrollments.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { authorize } from "../../shared/middlewares/authorize.js";
import { scopeToSchool } from "../../shared/middlewares/scopeToSchool.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  submitApplicationSchema,
  acceptApplicationSchema,
  rejectApplicationSchema,
  upsertFormTemplateSchema,
  queryApplicationsSchema,
} from "./enrollments.schema.js";
import { Role } from "../../shared/types/auth.types.js";

/**
 * Standalone applications router — mounted at /applications
 * Handles operations on a single enrollment by its own ID
 */
const router = Router();

// GET /applications/my — student views their own submitted applications
// Must be defined before /:id routes to prevent "my" being treated as an ID
router.get(
  "/my",
  authenticate,
  authorize(Role.STUDENT),
  enrollmentsController.getMyApplications,
);

// PATCH /applications/:id/accept — admin accepts and assigns student to classroom
router.patch(
  "/:id/accept",
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  scopeToSchool,
  validate(acceptApplicationSchema),
  enrollmentsController.acceptApplication,
);

// PATCH /applications/:id/reject — admin rejects the application
router.patch(
  "/:id/reject",
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  scopeToSchool,
  validate(rejectApplicationSchema),
  enrollmentsController.rejectApplication,
);

// POST /applications/:id/withdraw — student withdraws their own pending application
// Ownership verified inside the service, not middleware, because the check
// requires reading the DB record (studentId on the enrollment row)
router.post(
  "/:id/withdraw",
  authenticate,
  authorize(Role.STUDENT),
  enrollmentsController.withdrawApplication,
);

export default router;

/**
 * School-nested enrollment router — mounted at /schools/:id (mergeParams: true)
 * Handles application form template and application inbox under a specific school
 */
export const schoolEnrollmentRouter = Router({ mergeParams: true });

// GET /schools/:id/application-form — fetch the school's custom form fields (public)
schoolEnrollmentRouter.get(
  "/application-form",
  enrollmentsController.getFormTemplate,
);

// PUT /schools/:id/application-form — ADMIN sets or updates the form template
schoolEnrollmentRouter.put(
  "/application-form",
  authenticate,
  authorize(Role.ADMIN),
  scopeToSchool,
  validate(upsertFormTemplateSchema),
  enrollmentsController.upsertFormTemplate,
);

// GET /schools/:id/applications — admin inbox: paginated list with optional status filter
schoolEnrollmentRouter.get(
  "/applications",
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  scopeToSchool,
  validate(queryApplicationsSchema, "query"),
  enrollmentsController.getApplicationsBySchool,
);

// POST /schools/:id/applications — student submits an application to this school
schoolEnrollmentRouter.post(
  "/applications",
  authenticate,
  authorize(Role.STUDENT),
  validate(submitApplicationSchema),
  enrollmentsController.submitApplication,
);
