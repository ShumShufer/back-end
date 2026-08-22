import { Router } from "express";
import * as announcementsController from "./announcements.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { authorize } from "../../shared/middlewares/authorize.js";
import { validate } from "../../shared/middlewares/validate.js";
import * as classroomAnnouncementsController from "./announcements.classroom.controller.js";
import {
  createClassroomAnnouncementSchema as classroomAnnouncementSchema,
  createPlatformAnnouncementSchema,
  createSchoolAnnouncementSchema,
} from "./announcements.schema.js";
import { Role } from "../../shared/types/auth.types.js";

const router = Router();

/**
 * GET /announcements/platform — public platform feed
 */
router.get("/platform", announcementsController.getPlatformAnnouncements);

/**
 * POST /announcements/platform — SUPER_ADMIN broadcast
 */
router.post(
  "/platform",
  authenticate,
  authorize(Role.SUPER_ADMIN),
  validate(createPlatformAnnouncementSchema),
  announcementsController.broadcastPlatformAnnouncement,
);

// School-scoped router mounted at /schools/:id (mergeParams: true)
export const schoolAnnouncementsRouter = Router({ mergeParams: true });

schoolAnnouncementsRouter.get(
  "/announcements",
  announcementsController.getSchoolAnnouncements,
);

schoolAnnouncementsRouter.post(
  "/announcements",
  authenticate,
  authorize(Role.ADMIN, Role.SUPER_ADMIN),
  validate(createSchoolAnnouncementSchema),
  announcementsController.broadcastSchoolAnnouncement,
);

export default router;

// Classroom-scoped router mounted at /classrooms/:id (mergeParams: true)
export const classroomAnnouncementsRouter = Router({ mergeParams: true });

classroomAnnouncementsRouter.get(
  "/announcements",
  authenticate,
  classroomAnnouncementsController.getClassroomAnnouncements,
);

classroomAnnouncementsRouter.post(
  "/announcements",
  authenticate,
  authorize(Role.ADMIN, Role.EDUCATION_HEAD, Role.MENTOR, Role.SUPER_ADMIN),
  validate(classroomAnnouncementSchema),
  classroomAnnouncementsController.broadcastClassroomAnnouncement,
);
