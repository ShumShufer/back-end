import type { Request, Response, NextFunction } from "express";
import * as staffApplicationsService from "../services/staffApplications.service.js";
import { apiResponse } from "../helpers/apiResponse.js";
import type {
  CreateStaffPostInput,
  UpdateStaffPostInput,
  QueryStaffPostsInput,
  SubmitStaffApplicationInput,
  QueryStaffApplicationsInput,
} from "../validators/staffApplications.schema.js";

/**
 * Get all open staff posts — public browsing
 * GET /staff-posts
 */
export function getStaffPosts(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const query = req.query as unknown as QueryStaffPostsInput;
    const result = await staffApplicationsService.getStaffPosts(query);
    res
      .status(200)
      .json(apiResponse(result, "Staff posts retrieved successfully", 200));
  })().catch(next);
}

/**
 * Get all staff posts for a specific school (ADMIN managing their own posts)
 * GET /schools/:id/staff-posts
 */
export function getStaffPostsBySchool(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const query = req.query as unknown as QueryStaffPostsInput;
    const result = await staffApplicationsService.getStaffPostsBySchool(
      id as string,
      query,
    );
    res
      .status(200)
      .json(apiResponse(result, "School staff posts retrieved successfully", 200));
  })().catch(next);
}

/**
 * Get a single staff post by ID
 * GET /staff-posts/:id
 */
export function getStaffPostById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const result = await staffApplicationsService.getStaffPostById(id as string);
    res
      .status(200)
      .json(apiResponse(result, "Staff post retrieved successfully", 200));
  })().catch(next);
}

/**
 * Create a new staff job post for a school (ADMIN)
 * POST /schools/:id/staff-posts
 */
export function createStaffPost(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const input = req.body as CreateStaffPostInput;
    const result = await staffApplicationsService.createStaffPost(
      id as string,
      input,
    );
    res
      .status(201)
      .json(apiResponse(result, "Staff post created successfully", 201));
  })().catch(next);
}

/**
 * Update a staff post's description or status (ADMIN)
 * PATCH /staff-posts/:id
 */
export function updateStaffPost(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const input = req.body as UpdateStaffPostInput;
    const result = await staffApplicationsService.updateStaffPost(
      id as string,
      input,
    );
    res
      .status(200)
      .json(apiResponse(result, "Staff post updated successfully", 200));
  })().catch(next);
}

/**
 * Get all applications for a school's staff posts — admin inbox
 * GET /schools/:id/staff-applications
 */
export function getStaffApplicationsBySchool(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const query = req.query as unknown as QueryStaffApplicationsInput;
    const result = await staffApplicationsService.getStaffApplicationsBySchool(
      id as string,
      query,
    );
    res
      .status(200)
      .json(
        apiResponse(result, "Staff applications retrieved successfully", 200),
      );
  })().catch(next);
}

/**
 * Submit an application to a staff post (any authenticated user)
 * POST /staff-posts/:id/apply
 */
export function submitStaffApplication(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const applicantId = req.user!.id;
    const input = req.body as SubmitStaffApplicationInput;
    const result = await staffApplicationsService.submitStaffApplication(
      applicantId,
      id as string,
      input,
    );
    res
      .status(201)
      .json(apiResponse(result, "Staff application submitted successfully", 201));
  })().catch(next);
}

/**
 * Accept a staff application and promote the applicant (ADMIN)
 * POST /staff-applications/:id/accept
 */
export function acceptStaffApplication(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const reviewerId = req.user!.id;
    const result = await staffApplicationsService.acceptStaffApplication(
      id as string,
      reviewerId,
    );
    res
      .status(200)
      .json(
        apiResponse(result, "Staff application accepted and applicant role updated", 200),
      );
  })().catch(next);
}

/**
 * Reject a staff application (ADMIN)
 * POST /staff-applications/:id/reject
 */
export function rejectStaffApplication(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const reviewerId = req.user!.id;
    const result = await staffApplicationsService.rejectStaffApplication(
      id as string,
      reviewerId,
    );
    res
      .status(200)
      .json(apiResponse(result, "Staff application rejected successfully", 200));
  })().catch(next);
}
