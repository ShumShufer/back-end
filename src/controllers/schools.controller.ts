import type { Request, Response, NextFunction } from "express";
import * as schoolsService from "../services/schools.service.js";
import { apiResponse } from "../helpers/apiResponse.js";
import type {
  CreateSchoolInput,
  UpdateSchoolInput,
  UpdateSchoolStatusInput,
  QuerySchoolsInput,
} from "../validators/school.schema.js";

/**
 * Get all schools (Public, paginated, searchable)
 * GET /schools
 */
export function getAllSchools(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const query = req.query as unknown as QuerySchoolsInput;
    const result = await schoolsService.getAllSchools(query);
    res
      .status(200)
      .json(apiResponse(result, "Schools retrieved successfully", 200));
  })().catch(next);
}

/**
 * Get single school profile by ID
 * GET /schools/:id
 */
export function getSchoolById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const result = await schoolsService.getSchoolById(id as string);
    res
      .status(200)
      .json(apiResponse(result, "School details retrieved successfully", 200));
  })().catch(next);
}

/**
 * Create a new school (SUPER_ADMIN)
 * POST /schools
 */
export function createSchool(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const input = req.body as CreateSchoolInput;
    const result = await schoolsService.createSchool(input);
    res
      .status(201)
      .json(apiResponse(result, "School created successfully", 201));
  })().catch(next);
}

/**
 * Update school profile (ADMIN, SUPER_ADMIN)
 * PATCH /schools/:id
 */
export function updateSchool(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const input = req.body as UpdateSchoolInput;
    const result = await schoolsService.updateSchool(id as string, input);
    res
      .status(200)
      .json(apiResponse(result, "School updated successfully", 200));
  })().catch(next);
}

/**
 * Update school status (SUPER_ADMIN)
 * PATCH /schools/:id/status
 */
export function updateSchoolStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const input = req.body as UpdateSchoolStatusInput;
    const result = await schoolsService.updateSchoolStatus(id as string, input);
    res
      .status(200)
      .json(apiResponse(result, "School status updated successfully", 200));
  })().catch(next);
}

/**
 * Get school statistics
 * GET /schools/:id/stats
 */
export function getSchoolStats(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const result = await schoolsService.getSchoolStats(id as string);
    res
      .status(200)
      .json(apiResponse(result, "School statistics retrieved successfully", 200));
  })().catch(next);
}
