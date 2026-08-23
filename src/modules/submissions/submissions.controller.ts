import type { Request, Response, NextFunction } from "express";
import * as submissionsService from "./submissions.service.js";
import type { AuthUser } from "../../shared/types/auth.types.js";
import type {
  GradeSubmissionInput,
  QuerySubmissionsInput,
} from "./submissions.schema.js";

/**
 * GET /submissions
 */
export async function getSubmissions(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await submissionsService.getSubmissions(
      req.query as unknown as QuerySubmissionsInput,
      req.user as AuthUser,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /submissions/:id/grade — Grade a submission
 */
export async function gradeSubmission(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const graded = await submissionsService.gradeSubmission(
      id as string,
      req.body as GradeSubmissionInput,
      req.user as AuthUser,
    );
    res.json(graded);
  } catch (err) {
    next(err);
  }
}
