import { Router } from "express";
import * as notificationsController from "./notifications.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { authorize } from "../../shared/middlewares/authorize.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  createNotificationSchema,
  queryNotificationsSchema,
} from "./notifications.schema.js";
import { Role } from "../../shared/types/auth.types.js";

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
  "/read-all",
  authenticate,
  notificationsController.markAllAsRead,
);

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
