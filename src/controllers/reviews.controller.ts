import type { Request, Response, NextFunction } from "express";
import * as reviewsService from "../services/reviews.service.js";
import type { AuthUser } from "../types/auth.types.js";
import type {
  CreateReviewInput,
  QueryReviewsInput,
} from "../validators/reviews.schema.js";

/**
 * POST /schools/:id/reviews
 */
export async function createSchoolReview(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const review = await reviewsService.createSchoolReview(
      id as string,
      req.body as CreateReviewInput,
      req.user as AuthUser,
    );
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /schools/:id/reviews
 */
export async function getSchoolReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await reviewsService.getSchoolReviews(
      id as string,
      req.query as unknown as QueryReviewsInput,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}
