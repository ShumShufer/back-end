import type { Request, Response, NextFunction } from "express";
import * as studentsService from "./students.service.js";
import type { AuthUser } from "../../shared/types/auth.types.js";

/**
 * GET /students/:id/progress
 */
export async function getStudentProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const results = await studentsService.getStudentProgress(id as string, req.user as AuthUser);
    res.json(results);
  } catch (err) {
    next(err);
  }
}
