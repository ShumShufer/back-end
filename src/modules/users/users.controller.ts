import type { Request, Response, NextFunction } from "express";
import * as usersService from "./users.service.js";
import { apiResponse } from "../../shared/helpers/apiResponse.js";
import type { AuthUser } from "../../shared/types/auth.types.js";
import type { CreateUserInput, QueryUsersInput, UpdateUserInput } from "./users.schema.js";

export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await usersService.getUsers(req.query as unknown as QueryUsersInput, req.user as AuthUser);
    res.status(200).json(apiResponse(result, "Users retrieved successfully"));
  } catch (error) { next(error); }
}

export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await usersService.createUser(req.body as CreateUserInput, req.user as AuthUser);
    res.status(201).json(apiResponse(result, "User created successfully", 201));
  } catch (error) { next(error); }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await usersService.updateUser(req.params.id as string, req.body as UpdateUserInput, req.user as AuthUser);
    res.status(200).json(apiResponse(result, "User updated successfully"));
  } catch (error) { next(error); }
}

export async function updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await usersService.updateUser(req.params.id as string, { verificationStatus: (req.body as { status: "PENDING" | "VERIFIED" | "REJECTED" }).status }, req.user as AuthUser);
    res.status(200).json(apiResponse(result, "User status updated"));
  } catch (error) { next(error); }
}

export async function assignUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await usersService.updateUser(req.params.id as string, { role: (req.body as { role: CreateUserInput["role"] }).role }, req.user as AuthUser);
    res.status(200).json(apiResponse(result, "Role assigned"));
  } catch (error) { next(error); }
}

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
