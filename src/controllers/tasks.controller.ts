import type { Request, Response, NextFunction } from "express";
import * as tasksService from "../services/tasks.service.js";
import * as submissionsService from "../services/submissions.service.js";
import type { AuthUser } from "../types/auth.types.js";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  QueryTasksInput,
} from "../validators/tasks.schema.js";
import type { CreateSubmissionInput } from "../validators/submissions.schema.js";

/**
 * GET /tasks
 */
export async function getTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await tasksService.getTasks(
      req.query as unknown as QueryTasksInput,
      req.user as AuthUser,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /tasks/:id
 */
export async function getTaskById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const task = await tasksService.getTaskById(id as string, req.user as AuthUser);
    res.json(task);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /tasks
 */
export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await tasksService.createTask(
      req.body as CreateTaskInput,
      req.user as AuthUser,
    );
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /tasks/:id
 */
export async function updateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const task = await tasksService.updateTask(
      id as string,
      req.body as UpdateTaskInput,
      req.user as AuthUser,
    );
    res.json(task);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /tasks/:id
 */
export async function deleteTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await tasksService.deleteTask(id as string, req.user as AuthUser);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /tasks/:id/submissions — student submits work
 */
export async function submitTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const submission = await submissionsService.submitTask(
      id as string,
      req.body as CreateSubmissionInput,
      req.user as AuthUser,
    );
    res.status(201).json(submission);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /tasks/:id/submissions — list submissions for this task
 */
export async function getTaskSubmissions(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await submissionsService.getSubmissions(
      { taskId: id as string },
      req.user as AuthUser,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}
