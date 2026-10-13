import type { Request, Response, NextFunction } from "express";
import * as resourcesService from "./resources.service.js";
import { apiResponse } from "../../shared/helpers/apiResponse.js";
import type { AuthUser } from "../../shared/types/auth.types.js";
import type { CreateResourceInput } from "./resources.schema.js";

/**
 * GET /classrooms/:id/resources
 */
export async function getResources(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const resources = await resourcesService.getResources(id as string);
    res.json(apiResponse(resources, "Classroom resources retrieved successfully"));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /classrooms/:id/resources
 */
export async function createResource(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const resource = await resourcesService.createResource(
      id as string,
      req.body as CreateResourceInput,
      req.user as AuthUser,
    );
    res.status(201).json(apiResponse(resource, "Resource uploaded successfully", 201));
  } catch (err) {
    next(err);
  }
}
