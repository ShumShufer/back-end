import type { NextFunction, Request, Response } from "express";

import { AppError } from "../helpers/appError.js";
import { Role } from "../types/auth.types.js";

type AuthorizeRoleInput = Role | Role[];

export function authorize(...allowedRoles: AuthorizeRoleInput[]) {
  const normalizedRoles = new Set<Role>();

  for (const role of allowedRoles) {
    if (Array.isArray(role)) {
      for (const item of role) {
        normalizedRoles.add(item);
      }
      continue;
    }

    normalizedRoles.add(role);
  }

  return function authorizeMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void {
    if (!req.user) {
      next(AppError.unauthorized("Authentication required"));
      return;
    }

    if (!normalizedRoles.has(req.user.role)) {
      next(
        AppError.forbidden(
          "You do not have permission to access this resource",
        ),
      );
      return;
    }

    next();
  };
}
