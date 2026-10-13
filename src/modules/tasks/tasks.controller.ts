import type { Request, Response, NextFunction } from "express";
import * as tasksService from "./tasks.service.js";
import * as submissionsService from "../submissions/submissions.service.js";
import { apiResponse } from "../../shared/helpers/apiResponse.js";
import type { AuthUser } from "../../shared/types/auth.types.js";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  QueryTasksInput,
} from "./tasks.schema.js";
import type { CreateSubmissionInput } from "../submissions/submissions.schema.js";

/**
 * GET /tasks
 */
export async function getTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await tasksService.getTasks(
      req.query as unknown as QueryTasksInput,
      req.user as AuthUser,
    );
    res.json(apiResponse(result.tasks, "Tasks retrieved successfully", 200, result.meta));
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
    res.json(apiResponse(task, "Task retrieved successfully"));
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
    res.status(201).json(apiResponse(task, "Task created successfully", 201));
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
    res.json(apiResponse(task, "Task updated successfully"));
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
    res.json(apiResponse(result, "Task deleted successfully"));
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
    res.status(201).json(apiResponse(submission, "Task submitted successfully", 201));
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
    res.json(apiResponse(result.submissions, "Task submissions retrieved", 200, result.meta));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /classrooms/:id/tasks
 */
export async function getClassroomTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const query = {
      ...(req.query as unknown as QueryTasksInput),
      classroomId: id as string,
    };
    const result = await tasksService.getTasks(query, req.user as AuthUser);
    res.json(apiResponse(result.tasks, "Classroom tasks retrieved", 200, result.meta));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /classrooms/:id/tasks
 */
export async function createClassroomTask(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const taskInput: CreateTaskInput = {
      ...req.body,
      classroomId: id as string,
    };
    const task = await tasksService.createTask(taskInput, req.user as AuthUser);
    res.status(201).json(apiResponse(task, "Classroom task created successfully", 201));
  } catch (err) {
    next(err);
  }
}
