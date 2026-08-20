import { Router } from "express";
import * as tasksController from "../controllers/tasks.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import {
  createTaskSchema,
  updateTaskSchema,
  queryTasksSchema,
} from "../validators/tasks.schema.js";
import { createSubmissionSchema } from "../validators/submissions.schema.js";
import { Role } from "../types/auth.types.js";

const router = Router();

// GET /tasks — list tasks (students see only their enrolled classrooms)
router.get(
  "/",
  authenticate,
  validate(queryTasksSchema, "query"),
  tasksController.getTasks,
);

// GET /tasks/:id — get task detail
router.get("/:id", authenticate, tasksController.getTaskById);

// POST /tasks — create task (MENTOR, EDUCATION_HEAD, ADMIN, SUPER_ADMIN)
router.post(
  "/",
  authenticate,
  authorize(Role.MENTOR, Role.EDUCATION_HEAD, Role.ADMIN, Role.SUPER_ADMIN),
  validate(createTaskSchema),
  tasksController.createTask,
);

// PATCH /tasks/:id — update task
router.patch(
  "/:id",
  authenticate,
  authorize(Role.MENTOR, Role.EDUCATION_HEAD, Role.ADMIN, Role.SUPER_ADMIN),
  validate(updateTaskSchema),
  tasksController.updateTask,
);

// DELETE /tasks/:id — delete task
router.delete(
  "/:id",
  authenticate,
  authorize(Role.ADMIN, Role.EDUCATION_HEAD, Role.SUPER_ADMIN),
  tasksController.deleteTask,
);

// POST /tasks/:id/submissions — student submits work
router.post(
  "/:id/submissions",
  authenticate,
  authorize(Role.STUDENT),
  validate(createSubmissionSchema),
  tasksController.submitTask,
);

// GET /tasks/:id/submissions — list submissions for this task
router.get(
  "/:id/submissions",
  authenticate,
  authorize(Role.MENTOR, Role.EDUCATION_HEAD, Role.ADMIN, Role.SUPER_ADMIN),
  tasksController.getTaskSubmissions,
);

export default router;
