import { Router } from "express";
import * as attendanceController from "./attendance.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { authorize } from "../../shared/middlewares/authorize.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  createAttendanceSessionSchema,
  recordAttendanceBulkSchema,
  queryAttendanceSchema,
} from "./attendance.schema.js";
import { Role } from "../../shared/types/auth.types.js";

const router = Router();

// GET /attendance-sessions — list attendance sessions for a classroom
router.get(
  "/",
  authenticate,
  validate(queryAttendanceSchema, "query"),
  attendanceController.getAttendanceSessions,
);

// POST /attendance-sessions — create an attendance session
router.post(
  "/",
  authenticate,
  authorize(Role.MENTOR, Role.EDUCATION_HEAD, Role.ADMIN, Role.SUPER_ADMIN),
  validate(createAttendanceSessionSchema),
  attendanceController.createAttendanceSession,
);

// POST /attendance-sessions/:id/records — record attendance bulk
router.post(
  "/:id/records",
  authenticate,
  authorize(Role.MENTOR, Role.EDUCATION_HEAD, Role.ADMIN, Role.SUPER_ADMIN),
  validate(recordAttendanceBulkSchema),
  attendanceController.recordBulkAttendance,
);

export default router;

// Sub-router mounted at /classrooms/:id (mergeParams)
export const classroomAttendanceRouter = Router({ mergeParams: true });

/**
 * GET /classrooms/:id/attendance
 */
classroomAttendanceRouter.get(
  "/attendance",
  authenticate,
  attendanceController.getClassroomAttendance,
);
