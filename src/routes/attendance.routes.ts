import { Router } from "express";
import * as attendanceController from "../controllers/attendance.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import {
  createAttendanceSessionSchema,
  recordAttendanceBulkSchema,
  queryAttendanceSchema,
} from "../validators/attendance.schema.js";
import { Role } from "../types/auth.types.js";

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
