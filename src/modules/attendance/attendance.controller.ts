import type { Request, Response, NextFunction } from "express";
import * as attendanceService from "./attendance.service.js";
import { apiResponse } from "../../shared/helpers/apiResponse.js";
import type { AuthUser } from "../../shared/types/auth.types.js";
import type {
  CreateAttendanceSessionInput,
  RecordAttendanceBulkInput,
  QueryAttendanceInput,
} from "./attendance.schema.js";

/**
 * GET /attendance-sessions
 */
export async function getAttendanceSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const sessions = await attendanceService.getAttendanceSessions(
      req.query as unknown as QueryAttendanceInput,
      req.user as AuthUser,
    );
    res.json(apiResponse(sessions, "Attendance sessions retrieved successfully"));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /attendance-sessions
 */
export async function createAttendanceSession(req: Request, res: Response, next: NextFunction) {
  try {
    const input = {
      ...req.body,
      classroomId: req.body.classroomId || req.params.id,
    };
    const session = await attendanceService.createAttendanceSession(
      input as CreateAttendanceSessionInput,
      req.user as AuthUser,
    );
    res.status(201).json(apiResponse(session, "Attendance session created successfully", 201));
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
    res.json(apiResponse(session, "Attendance recorded successfully"));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /classrooms/:id/attendance — full sheet (sessions + records)
 */
export async function getClassroomAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const sheet = await attendanceService.getClassroomAttendanceSheet(id as string, req.user as AuthUser);
    res.json(apiResponse(sheet, "Classroom attendance sheet retrieved successfully"));
  } catch (err) {
    next(err);
  }
}
