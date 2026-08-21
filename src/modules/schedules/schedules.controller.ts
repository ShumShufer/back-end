import type { Request, Response, NextFunction } from "express";
import * as schedulesService from "./schedules.service.js";
import type { AuthUser } from "../../shared/types/auth.types.js";
import type {
  CreateScheduleInput,
  UpdateScheduleInput,
  QuerySchedulesInput,
} from "./schedules.schema.js";

/**
 * GET /schedules
 */
export async function getScheduleEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const events = await schedulesService.getScheduleEvents(
      req.query as unknown as QuerySchedulesInput,
      req.user as AuthUser,
    );
    res.json(events);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /schedules/:id
 */
export async function getScheduleEventById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const event = await schedulesService.getScheduleEventById(id as string);
    res.json(event);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /schedules
 */
export async function createScheduleEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const event = await schedulesService.createScheduleEvent(
      req.body as CreateScheduleInput,
      req.user as AuthUser,
    );
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /schedules/:id
 */
export async function updateScheduleEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const event = await schedulesService.updateScheduleEvent(
      id as string,
      req.body as UpdateScheduleInput,
      req.user as AuthUser,
    );
    res.json(event);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /schedules/:id
 */
export async function deleteScheduleEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await schedulesService.deleteScheduleEvent(
      id as string,
      req.user as AuthUser,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}
