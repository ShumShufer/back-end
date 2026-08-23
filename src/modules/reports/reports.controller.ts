import type { Request, Response, NextFunction } from "express";
import * as reportsService from "./reports.service.js";
import type { AuthUser } from "../../shared/types/auth.types.js";
import type { CreateStudentReportInput } from "./reports.schema.js";

/**
 * POST /classrooms/:id/reports
 */
export async function createStudentReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const report = await reportsService.createStudentReport(
      id as string,
      req.body as CreateStudentReportInput,
      req.user as AuthUser,
    );
    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /classrooms/:id/reports
 */
export async function getClassroomReports(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const reports = await reportsService.getClassroomReports(id as string, req.user as AuthUser);
    res.json(reports);
  } catch (err) {
    next(err);
  }
}
