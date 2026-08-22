import type { NextFunction, Request, Response } from "express";

import { AppError } from "../helpers/appError.js";
import prisma from "../config/db.js";
import { Role } from "../types/auth.types.js";

async function getResourceSchoolId(req: Request): Promise<string | undefined> {
  const path = req.originalUrl.split("?")[0] ?? "";

  // School-nested routes and the school resource itself carry the actual school ID.
  const schoolMatch = path.match(/\/schools\/([^/]+)(?:\/|$)/);
  if (schoolMatch?.[1]) return schoolMatch[1];

  const resourceId = typeof req.params.id === "string" ? req.params.id : undefined;
  const bodySchoolId = typeof req.body?.schoolId === "string" ? req.body.schoolId : undefined;
  const querySchoolId = typeof req.query.schoolId === "string" ? req.query.schoolId : undefined;
  if (!resourceId) {
    if (bodySchoolId ?? querySchoolId) return bodySchoolId ?? querySchoolId;

    // Classroom creation derives the school from the authenticated user when
    // the request does not provide schoolId.
    if (req.method === "POST" && /\/classrooms\/?$/.test(path)) {
      return req.user?.schoolId ?? undefined;
    }

    return undefined;
  }

  if (/\/branches\//.test(path)) {
    return (await prisma.branch.findUnique({ where: { id: resourceId }, select: { schoolId: true } }))?.schoolId;
  }

  if (/\/classrooms\//.test(path)) {
    return (await prisma.classroom.findUnique({ where: { id: resourceId }, select: { schoolId: true } }))?.schoolId;
  }

  if (/\/applications\//.test(path) && !/\/staff-applications\//.test(path)) {
    return (await prisma.enrollment.findUnique({ where: { id: resourceId }, select: { schoolId: true } }))?.schoolId;
  }

  if (/\/staff-posts\//.test(path)) {
    return (await prisma.staffApplicationPost.findUnique({ where: { id: resourceId }, select: { schoolId: true } }))?.schoolId;
  }

  if (/\/staff-applications\//.test(path)) {
    const application = await prisma.staffApplication.findUnique({
      where: { id: resourceId },
      select: { postId: true },
    });
    if (!application) return undefined;
    return (
      await prisma.staffApplicationPost.findUnique({
        where: { id: application.postId },
        select: { schoolId: true },
      })
    )?.schoolId;
  }

  return undefined;
}

export async function scopeToSchool(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    next(AppError.unauthorized("Authentication required"));
    return;
  }

  if (req.user.role === Role.SUPER_ADMIN) {
    next();
    return;
  }

  const schoolScopedRoles = new Set([
    Role.ADMIN,
    Role.EDUCATION_HEAD,
    Role.MENTOR,
    Role.STUDENT,
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

  if (!userSchoolId) {
    next(AppError.forbidden("School context is required for this action"));
    return;
  }

  try {
    const requestedSchoolId = await getResourceSchoolId(req);

    if (!requestedSchoolId) {
      // Resource isn't school-addressable (e.g. /classrooms/my, /notifications);
      // it is scoped to the caller by the controller, so allow it through.
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
  } catch (error) {
    next(error);
  }
}
