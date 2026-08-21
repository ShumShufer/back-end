import { Router } from "express";
import * as submissionsController from "./submissions.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { authorize } from "../../shared/middlewares/authorize.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  gradeSubmissionSchema,
  querySubmissionsSchema,
} from "./submissions.schema.js";
import { Role } from "../../shared/types/auth.types.js";

const router = Router();

// GET /submissions — list submissions
router.get(
  "/",
  authenticate,
  validate(querySubmissionsSchema, "query"),
  submissionsController.getSubmissions,
);

// PATCH /submissions/:id/grade — grade a submission (Mentor, Admin, Education Head)
router.patch(
  "/:id/grade",
  authenticate,
  authorize(Role.MENTOR, Role.EDUCATION_HEAD, Role.ADMIN, Role.SUPER_ADMIN),
  validate(gradeSubmissionSchema),
  submissionsController.gradeSubmission,
);

export default router;
