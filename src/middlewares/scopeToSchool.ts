import type { NextFunction, Request, Response } from "express";

import { AppError } from "../helpers/appError.js";
import { Role } from "../types/auth.types.js";

export function scopeToSchool(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    next(AppError.unauthorized("Authentication required"));
    return;
  }

  if (req.user.role === Role.SUPER_ADMIN || req.user.role === Role.STUDENT) {
    next();
    return;
  }

  const schoolScopedRoles = new Set([
    Role.ADMIN,
    Role.EDUCATION_HEAD,
    Role.MENTOR,
  ]);

  if (!schoolScopedRoles.has(req.user.role)) {
    next(
      AppError.forbidden(
        "This role is not allowed to access school-scoped resources",
      ),
    );
    return;
  }

  const userSchoolId = req.user.schoolId;
  const requestedSchoolId =
    (req.params.schoolId as string | undefined) ??
    (req.body?.schoolId as string | undefined) ??
    (req.query.schoolId as string | undefined);

  if (!userSchoolId) {
    next(AppError.forbidden("School context is required for this action"));
    return;
  }

  if (!requestedSchoolId) {
    next();
    return;
  }

  if (requestedSchoolId !== userSchoolId) {
    next(
      AppError.forbidden(
        "You can only access resources within your own school",
      ),
    );
    return;
  }

  next();
}
