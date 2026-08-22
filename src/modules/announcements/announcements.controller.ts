import type { Request, Response, NextFunction } from "express";
import * as announcementsService from "./announcements.service.js";
import type { AuthUser } from "../../shared/types/auth.types.js";
import { apiResponse } from "../../shared/helpers/apiResponse.js";
import type {
  CreatePlatformAnnouncementInput,
  CreateSchoolAnnouncementInput,
} from "./announcements.schema.js";

/**
 * POST /announcements/platform — SUPER_ADMIN broadcasts to everyone
 */
export async function broadcastPlatformAnnouncement(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const announcement =
      await announcementsService.broadcastPlatformAnnouncement(
        req.body as CreatePlatformAnnouncementInput,
        req.user as AuthUser,
      );
    res.status(201).json(
      apiResponse(announcement),
    );
  } catch (err) {
    next(err);
  }
}

/**
 * GET /announcements/platform — public feed
 */
export async function getPlatformAnnouncements(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const announcements = await announcementsService.getPlatformAnnouncements();
    res.json(apiResponse(announcements));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /schools/:id/announcements — school feed
 */
export async function getSchoolAnnouncements(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const announcements = await announcementsService.getSchoolAnnouncements(
      id as string,
    );
    res.json(apiResponse(announcements));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /schools/:id/announcements — ADMIN posts for their school
 */
export async function broadcastSchoolAnnouncement(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const announcement = await announcementsService.broadcastSchoolAnnouncement(
      id as string,
      req.body as CreateSchoolAnnouncementInput,
      req.user as AuthUser,
    );
    res.status(201).json(apiResponse(announcement));
  } catch (err) {
    next(err);
  }
}
