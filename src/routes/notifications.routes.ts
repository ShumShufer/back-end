import { Router } from "express";
import * as notificationsController from "../controllers/notifications.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import {
  createNotificationSchema,
  queryNotificationsSchema,
} from "../validators/notifications.schema.js";
import { Role } from "../types/auth.types.js";

const router = Router();

/**
 * GET /notifications — Get all notifications for the current user
 */
router.get(
  "/",
  authenticate,
  validate(queryNotificationsSchema, "query"),
  notificationsController.getUserNotifications,
);

/**
 * PATCH /notifications/:id/read — Mark notification as read
 */
router.patch(
  "/:id/read",
  authenticate,
  notificationsController.markAsRead,
);

/**
 * POST /notifications — Broadcast a manual notification (Admin and above)
 */
router.post(
  "/",
  authenticate,
  authorize(Role.ADMIN, Role.EDUCATION_HEAD, Role.SUPER_ADMIN),
  validate(createNotificationSchema),
  notificationsController.createNotification,
);

export default router;
