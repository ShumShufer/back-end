import type { Request, Response, NextFunction } from "express";
import * as notificationsService from "./notifications.service.js";
import type { AuthUser } from "../../shared/types/auth.types.js";
import type {
  CreateNotificationInput,
  QueryNotificationsInput,
} from "./notifications.schema.js";

/**
 * GET /notifications
 */
export async function getUserNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await notificationsService.getUserNotifications(
      req.query as unknown as QueryNotificationsInput,
      req.user as AuthUser,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /notifications/:id/read
 */
export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const recipient = await notificationsService.markAsRead(id as string, req.user as AuthUser);
    res.json(recipient);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /notifications
 */
export async function createNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const notification = await notificationsService.createManualNotification(
      req.body as CreateNotificationInput,
      req.user as AuthUser,
    );
    res.status(201).json(notification);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /notifications/read-all — mark all as read for the current user
 */
export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await notificationsService.markAllAsRead((req.user as AuthUser).id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
