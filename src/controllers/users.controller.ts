import type { Request, Response, NextFunction } from "express";
import * as usersService from "../services/users.service.js";
import { apiResponse } from "../helpers/apiResponse.js";

/**
 * Get user by ID
 * GET /users/:id
 * Protected route - requires authentication
 */
export function getUserById(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { id } = req.params;
    const result = await usersService.getUserById(id as string);
    res.status(200).json(apiResponse(result, "User profile retrieved"));
  })().catch(next);
}
