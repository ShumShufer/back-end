import { Router } from "express";
import * as agreementsController from "./agreements.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { authorize } from "../../shared/middlewares/authorize.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  createAgreementSchema,
  updateAgreementStatusSchema,
  createPracticeRequestSchema,
  updatePracticeRequestStatusSchema,
} from "./agreements.schema.js";
import { Role } from "../../shared/types/auth.types.js";

const router = Router();

/**
 * School Agreements
 */

// GET /agreements — list school agreements
router.get(
  "/",
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  agreementsController.getSchoolAgreements,
);

// POST /agreements — propose agreement
router.post(
  "/",
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  validate(createAgreementSchema),
  agreementsController.createSchoolAgreement,
);

// PATCH /agreements/:id/status — accept/reject agreement
router.patch(
  "/:id/status",
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  validate(updateAgreementStatusSchema),
  agreementsController.updateAgreementStatus,
);

// PATCH /agreements/:id/accept — direct accept action
router.patch(
  "/:id/accept",
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  agreementsController.acceptAgreement,
);

// PATCH /agreements/:id/terminate — direct terminate action
router.patch(
  "/:id/terminate",
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  agreementsController.terminateAgreement,
);

/**
 * Practice-Elsewhere router export
 */
export const practiceRequestsRouter = Router();

// GET /practice-requests — list practice requests
practiceRequestsRouter.get(
  "/",
  authenticate,
  agreementsController.getPracticeRequests,
);

// POST /practice-requests — submit practice request
practiceRequestsRouter.post(
  "/",
  authenticate,
  authorize(Role.STUDENT),
  validate(createPracticeRequestSchema),
  agreementsController.createPracticeRequest,
);

// PATCH /practice-requests/:id/status — accept/reject practice request
practiceRequestsRouter.patch(
  "/:id/status",
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  validate(updatePracticeRequestStatusSchema),
  agreementsController.updatePracticeRequestStatus,
);

// PATCH /practice-requests/:id/approve — direct approve action
practiceRequestsRouter.patch(
  "/:id/approve",
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  agreementsController.approvePracticeRequest,
);

// PATCH /practice-requests/:id/reject — direct reject action
practiceRequestsRouter.patch(
  "/:id/reject",
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  agreementsController.rejectPracticeRequest,
);

export default router;
