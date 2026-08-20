import { Router } from "express";
import * as submissionsController from "../controllers/submissions.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import {
  gradeSubmissionSchema,
  querySubmissionsSchema,
} from "../validators/submissions.schema.js";
import { Role } from "../types/auth.types.js";

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
