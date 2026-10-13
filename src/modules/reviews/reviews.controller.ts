import type { Request, Response, NextFunction } from "express";
import * as reviewsService from "./reviews.service.js";
import { apiResponse } from "../../shared/helpers/apiResponse.js";
import type { AuthUser } from "../../shared/types/auth.types.js";
import type {
  CreateReviewInput,
  QueryReviewsInput,
} from "./reviews.schema.js";

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
    res.status(201).json(apiResponse(review, "School review submitted successfully", 201));
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
    res.json(apiResponse(result.reviews, "School reviews retrieved successfully", 200, result.meta));
  } catch (err) {
    next(err);
  }
}
