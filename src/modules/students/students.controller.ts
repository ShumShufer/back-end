import type { Request, Response, NextFunction } from "express";
import * as studentsService from "./students.service.js";
import { apiResponse } from "../../shared/helpers/apiResponse.js";
import type { AuthUser } from "../../shared/types/auth.types.js";

/**
 * GET /students/:id/progress
 */
export async function getStudentProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const results = await studentsService.getStudentProgress(id as string, req.user as AuthUser);
    res.json(apiResponse(results, "Student course progress retrieved"));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /students/:id/performance-report
 */
export async function getStudentPerformanceReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const report = await studentsService.getStudentPerformanceReport(id as string, req.user as AuthUser);
    res.json(apiResponse(report, "Student performance report retrieved"));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /students/:id/submissions
 */
export async function getStudentSubmissions(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await studentsService.getStudentSubmissions(
      id as string,
      req.user as AuthUser,
      req.query.page ? Number(req.query.page) : 1,
      req.query.limit ? Number(req.query.limit) : 20,
    );
    res.json(apiResponse(result.submissions, "Student submissions retrieved", 200, result.meta));
  } catch (err) {
    next(err);
  }
}
