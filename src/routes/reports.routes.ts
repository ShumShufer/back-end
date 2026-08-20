import { Router } from "express";
import * as reportsController from "../controllers/reports.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { createStudentReportSchema } from "../validators/reports.schema.js";
import { Role } from "../types/auth.types.js";

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
