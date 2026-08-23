import type { Request, Response, NextFunction } from "express";
import * as announcementsService from "./announcements.service.js";
import type { AuthUser } from "../../shared/types/auth.types.js";
import type { CreateClassroomAnnouncementInput } from "./announcements.schema.js";

/**
 * GET /classrooms/:id/announcements
 */
export async function getClassroomAnnouncements(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const announcements = await announcementsService.getClassroomAnnouncements(id as string);
    res.json(announcements);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /classrooms/:id/announcements
 */
export async function broadcastClassroomAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const announcement = await announcementsService.broadcastClassroomAnnouncement(
      id as string,
      req.body as CreateClassroomAnnouncementInput,
      req.user as AuthUser,
    );
    res.status(201).json(announcement);
  } catch (err) {
    next(err);
  }
}
