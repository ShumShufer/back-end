import type { Request, Response, NextFunction } from "express";
import * as quizzesService from "./quizzes.service.js";
import type { AuthUser } from "../../shared/types/auth.types.js";
import type {
  CreateQuizInput,
  UpdateQuizInput,
  SubmitQuizInput,
} from "./quizzes.schema.js";

/**
 * GET /quizzes
 */
export async function getQuizzes(req: Request, res: Response, next: NextFunction) {
  try {
    const topicId = req.query.topicId as string | undefined;
    const quizzes = await quizzesService.getQuizzes(topicId);
    res.json(quizzes);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /quizzes/:id
 */
export async function getQuizById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const quiz = await quizzesService.getQuizById(id as string, req.user as AuthUser);
    res.json(quiz);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /quizzes
 */
export async function createQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const quiz = await quizzesService.createQuiz(
      req.body as CreateQuizInput,
      req.user as AuthUser,
    );
    res.status(201).json(quiz);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /quizzes/:id
 */
export async function updateQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const quiz = await quizzesService.updateQuiz(
      id as string,
      req.body as UpdateQuizInput,
      req.user as AuthUser,
    );
    res.json(quiz);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /quizzes/:id/submit — Submit student responses and evaluate
 */
export async function submitQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await quizzesService.submitQuiz(
      id as string,
      req.body as SubmitQuizInput,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}
