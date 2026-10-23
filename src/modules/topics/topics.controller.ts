import type { Request, Response, NextFunction } from "express";
import * as topicsService from "./topics.service.js";
import { apiResponse } from "../../shared/helpers/apiResponse.js";
import type { AuthUser } from "../../shared/types/auth.types.js";
import type { UpdateTopicInput } from "./topics.schema.js";

/**
 * GET /topics/:id — get topic details with quizzes and resources
 */
export async function getTopicById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const topic = await topicsService.getTopicById(id as string, req.user as AuthUser);
    res.json(apiResponse(topic, "Topic retrieved successfully"));
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /topics/:id — update a topic's title, order, or content
 */
export async function updateTopic(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const topic = await topicsService.updateTopic(
      id as string,
      req.body as UpdateTopicInput,
      req.user as AuthUser,
    );
    res.json(apiResponse(topic, "Topic updated successfully"));
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /topics/:id — delete a topic and re-sequence remaining topics
 */
export async function deleteTopic(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await topicsService.deleteTopic(id as string, req.user as AuthUser);
    res.json(apiResponse(result, "Topic deleted successfully"));
  } catch (err) {
    next(err);
  }
}
