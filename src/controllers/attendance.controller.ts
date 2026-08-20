import type { Request, Response, NextFunction } from "express";
import * as attendanceService from "../services/attendance.service.js";
import type { AuthUser } from "../types/auth.types.js";
import type {
  CreateAttendanceSessionInput,
  RecordAttendanceBulkInput,
  QueryAttendanceInput,
} from "../validators/attendance.schema.js";

/**
 * GET /attendance-sessions
 */
export async function getAttendanceSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const sessions = await attendanceService.getAttendanceSessions(
      req.query as unknown as QueryAttendanceInput,
      req.user as AuthUser,
    );
    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /attendance-sessions
 */
export async function createAttendanceSession(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await attendanceService.createAttendanceSession(
      req.body as CreateAttendanceSessionInput,
      req.user as AuthUser,
    );
    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /attendance-sessions/:id/records — Mark bulk attendance
 */
export async function recordBulkAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const session = await attendanceService.recordBulkAttendance(
      id as string,
      req.body as RecordAttendanceBulkInput,
      req.user as AuthUser,
    );
    res.json(session);
  } catch (err) {
    next(err);
  }
}
