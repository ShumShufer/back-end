import type { Request, Response, NextFunction } from "express";
import * as adminService from "./admin.service.js";
import { apiResponse } from "../../shared/helpers/apiResponse.js";
import type { AuthUser } from "../../shared/types/auth.types.js";

/**
 * GET /admin/dashboard
 * Platform-wide super admin metrics.
 */
export async function getSuperAdminDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await adminService.getSuperAdminDashboard(req.user as AuthUser);
    res.json(apiResponse(result, "Super admin dashboard retrieved"));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /admin/commission-overview
 * Platform-wide revenue & commission report for SUPER_ADMIN.
 */
export async function getCommissionOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await adminService.getCommissionOverview(req.user as AuthUser);
    res.json(apiResponse(result, "Commission overview retrieved"));
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
    res.json(apiResponse(result, "School dashboard retrieved"));
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
    res.json(apiResponse(result, "Mentor dashboard retrieved"));
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
    res.json(apiResponse(result, "Education head dashboard retrieved"));
  } catch (err) {
    next(err);
  }
}
