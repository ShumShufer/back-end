import type { Request, Response, NextFunction } from "express";
import * as reportsService from "./reports.service.js";
import { apiResponse } from "../../shared/helpers/apiResponse.js";
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
    res.status(201).json(apiResponse(report, "Student report created successfully", 201));
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
    res.json(apiResponse(reports, "Classroom reports retrieved successfully"));
  } catch (err) {
    next(err);
  }
}
