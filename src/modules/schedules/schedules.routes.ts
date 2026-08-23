import { Router } from "express";
import * as schedulesController from "./schedules.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { authorize } from "../../shared/middlewares/authorize.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  createScheduleSchema,
  updateScheduleSchema,
  querySchedulesSchema,
} from "./schedules.schema.js";
import { Role } from "../../shared/types/auth.types.js";

const router = Router();

// GET /schedules — list events (filtered by scope, classroom, school)
router.get(
  "/",
  authenticate,
  validate(querySchedulesSchema, "query"),
  schedulesController.getScheduleEvents,
);

// GET /schedules/:id — get event detail
router.get("/:id", authenticate, schedulesController.getScheduleEventById);

// POST /schedules — create event
router.post(
  "/",
  authenticate,
  authorize(Role.MENTOR, Role.EDUCATION_HEAD, Role.ADMIN, Role.SUPER_ADMIN),
  validate(createScheduleSchema),
  schedulesController.createScheduleEvent,
);

// PATCH /schedules/:id — update event (enforces priority locking)
router.patch(
  "/:id",
  authenticate,
  authorize(Role.MENTOR, Role.EDUCATION_HEAD, Role.ADMIN, Role.SUPER_ADMIN),
  validate(updateScheduleSchema),
  schedulesController.updateScheduleEvent,
);

// DELETE /schedules/:id — delete event (enforces priority locking)
router.delete(
  "/:id",
  authenticate,
  authorize(Role.MENTOR, Role.EDUCATION_HEAD, Role.ADMIN, Role.SUPER_ADMIN),
  schedulesController.deleteScheduleEvent,
);

export default router;
