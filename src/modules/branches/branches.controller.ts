import type { Request, Response, NextFunction } from "express";
import * as branchesService from "./branches.service.js";
import { apiResponse } from "../../shared/helpers/apiResponse.js";
import type {
  CreateBranchInput,
  UpdateBranchInput,
  QueryNearbyBranchesInput,
} from "./branch.schema.js";

/**
 * Get all branches for a school (Public)
 * GET /schools/:id/branches
 */
export function getBranchesBySchoolId(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const result = await branchesService.getBranchesBySchoolId(id as string);
    res
      .status(200)
      .json(apiResponse(result, "Branches retrieved successfully", 200));
  })().catch(next);
}

/**
 * Get single branch by ID
 * GET /branches/:id
 */
export function getBranchById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const result = await branchesService.getBranchById(id as string);
    res
      .status(200)
      .json(apiResponse(result, "Branch details retrieved successfully", 200));
  })().catch(next);
}

/**
 * Create a new branch under a school (ADMIN)
 * POST /schools/:id/branches
 */
export function createBranch(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const input = req.body as CreateBranchInput;
    const result = await branchesService.createBranch(id as string, input);
    res
      .status(201)
      .json(apiResponse(result, "Branch created successfully", 201));
  })().catch(next);
}

/**
 * Update an existing branch (ADMIN)
 * PATCH /branches/:id
 */
export function updateBranch(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const input = req.body as UpdateBranchInput;
    const result = await branchesService.updateBranch(id as string, input);
    res
      .status(200)
      .json(apiResponse(result, "Branch updated successfully", 200));
  })().catch(next);
}

/**
 * Delete a branch (ADMIN)
 * DELETE /branches/:id
 */
export function deleteBranch(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const result = await branchesService.deleteBranch(id as string);
    res
      .status(200)
      .json(apiResponse(result, "Branch deleted successfully", 200));
  })().catch(next);
}

/**
 * Get branches near a geographic coordinate (Public)
 * GET /branches/nearby?lat=&lng=&radius=
 */
export function getNearbyBranches(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const query = req.query as unknown as QueryNearbyBranchesInput;
    const result = await branchesService.getNearbyBranches(query);
    res
      .status(200)
      .json(apiResponse(result, "Nearby branches retrieved successfully", 200));
  })().catch(next);
}
