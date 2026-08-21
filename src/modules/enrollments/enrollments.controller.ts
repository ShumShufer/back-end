import type { Request, Response, NextFunction } from "express";
import * as enrollmentsService from "./enrollments.service.js";
import { apiResponse } from "../../shared/helpers/apiResponse.js";
import type {
  SubmitApplicationInput,
  AcceptApplicationInput,
  RejectApplicationInput,
  UpsertFormTemplateInput,
  QueryApplicationsInput,
} from "./enrollments.schema.js";

/**
 * Get the application form template for a school
 * GET /schools/:id/application-form
 */
export function getFormTemplate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const result = await enrollmentsService.getFormTemplate(id as string);
    res
      .status(200)
      .json(apiResponse(result, "Application form template retrieved successfully", 200));
  })().catch(next);
}

/**
 * Create or update the application form template for a school (ADMIN)
 * PUT /schools/:id/application-form
 */
export function upsertFormTemplate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const input = req.body as UpsertFormTemplateInput;
    const result = await enrollmentsService.upsertFormTemplate(id as string, input);
    res
      .status(200)
      .json(apiResponse(result, "Application form template saved successfully", 200));
  })().catch(next);
}

/**
 * Get all applications for a school — admin inbox view
 * GET /schools/:id/applications
 */
export function getApplicationsBySchool(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const query = req.query as unknown as QueryApplicationsInput;
    const result = await enrollmentsService.getApplicationsBySchool(id as string, query);
    res
      .status(200)
      .json(apiResponse(result, "Applications retrieved successfully", 200));
  })().catch(next);
}

/**
 * Get all applications submitted by the authenticated student
 * GET /applications/my
 */
export function getMyApplications(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const studentId = req.user!.id;
    const result = await enrollmentsService.getMyApplications(studentId);
    res
      .status(200)
      .json(apiResponse(result, "Your applications retrieved successfully", 200));
  })().catch(next);
}

/**
 * Get all applications for a specific student by their user ID
 * GET /students/:id/applications
 * Accessible by: the student themselves, ADMIN of their school, SUPER_ADMIN
 */
export function getApplicationsByStudentId(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const result = await enrollmentsService.getApplicationsByStudentId(
      id as string,
      req.user!,
    );
    res
      .status(200)
      .json(apiResponse(result, "Student applications retrieved successfully", 200));
  })().catch(next);
}

/**
 * Submit a new enrollment application to a school (STUDENT)
 * POST /schools/:id/applications
 */
export function submitApplication(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const studentId = req.user!.id;
    const { id } = req.params;
    const input = req.body as SubmitApplicationInput;
    const result = await enrollmentsService.submitApplication(studentId, id as string, input);
    res
      .status(201)
      .json(apiResponse(result, "Application submitted successfully", 201));
  })().catch(next);
}

/**
 * Accept an enrollment application and assign student to a classroom (ADMIN)
 * POST /applications/:id/accept
 */
export function acceptApplication(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const reviewerId = req.user!.id;
    const input = req.body as AcceptApplicationInput;
    const result = await enrollmentsService.acceptApplication(id as string, reviewerId, input);
    res
      .status(200)
      .json(apiResponse(result, "Application accepted and student assigned to classroom", 200));
  })().catch(next);
}

/**
 * Reject an enrollment application (ADMIN)
 * POST /applications/:id/reject
 */
export function rejectApplication(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const reviewerId = req.user!.id;
    const input = req.body as RejectApplicationInput;
    const result = await enrollmentsService.rejectApplication(id as string, reviewerId, input);
    res
      .status(200)
      .json(apiResponse(result, "Application rejected successfully", 200));
  })().catch(next);
}

/**
 * Withdraw a pending application (STUDENT - own applications only)
 * POST /applications/:id/withdraw
 */
export function withdrawApplication(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const studentId = req.user!.id;
    const result = await enrollmentsService.withdrawApplication(id as string, studentId);
    res
      .status(200)
      .json(apiResponse(result, "Application withdrawn successfully", 200));
  })().catch(next);
}
