import type { Request, Response, NextFunction } from "express";
import * as adminService from "./admin.service.js";
import type { AuthUser } from "../../shared/types/auth.types.js";

/**
 * GET /admin/dashboard
 * Platform-wide super admin metrics.
 */
export async function getSuperAdminDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await adminService.getSuperAdminDashboard(req.user as AuthUser);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /schools/:id/dashboard
 * School-level KPIs for Admin / Education Head.
 */
export async function getSchoolDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await adminService.getSchoolDashboard(id as string, req.user as AuthUser);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /mentor/:id/dashboard
 * Mentor classroom/submission stats.
 */
export async function getMentorDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await adminService.getMentorDashboard(id as string, req.user as AuthUser);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /education-head/:id/dashboard
 * Education Head academic overview.
 */
export async function getEducationHeadDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await adminService.getEducationHeadDashboard(id as string, req.user as AuthUser);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
