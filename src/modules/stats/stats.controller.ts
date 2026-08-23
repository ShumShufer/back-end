import type { Request, Response, NextFunction } from "express";
import * as statsService from "./stats.service.js";

/**
 * GET /stats/platform — honest platform-wide numbers (public)
 */
export async function getPlatformStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await statsService.getPlatformStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}
