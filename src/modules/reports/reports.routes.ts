import { Router } from "express";
import * as reportsController from "./reports.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { authorize } from "../../shared/middlewares/authorize.js";
import { validate } from "../../shared/middlewares/validate.js";
import { createStudentReportSchema } from "./reports.schema.js";
import { Role } from "../../shared/types/auth.types.js";

// Mounted with mergeParams under /classrooms/:id
const router = Router({ mergeParams: true });

/**
 * GET /classrooms/:id/reports — View all reports for a classroom
 */
router.get(
  "/reports",
  authenticate,
  authorize(Role.MENTOR, Role.ADMIN, Role.EDUCATION_HEAD, Role.SUPER_ADMIN),
  reportsController.getClassroomReports,
);

/**
 * POST /classrooms/:id/reports — File a student report
 */
router.post(
  "/reports",
  authenticate,
  authorize(Role.MENTOR, Role.ADMIN, Role.EDUCATION_HEAD, Role.SUPER_ADMIN),
  validate(createStudentReportSchema),
  reportsController.createStudentReport,
);

export { router as classroomReportsRouter };
