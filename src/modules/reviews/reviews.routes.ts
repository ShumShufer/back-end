import { Router } from "express";
import * as reviewsController from "./reviews.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { authorize } from "../../shared/middlewares/authorize.js";
import { validate } from "../../shared/middlewares/validate.js";
import { createReviewSchema, queryReviewsSchema } from "./reviews.schema.js";
import { Role } from "../../shared/types/auth.types.js";

// Mounted with mergeParams under /schools/:id
const router = Router({ mergeParams: true });

/**
 * GET /schools/:id/reviews — Public listing of reviews
 */
router.get(
  "/reviews",
  validate(queryReviewsSchema, "query"),
  reviewsController.getSchoolReviews,
);

/**
 * POST /schools/:id/reviews — Leave a review (Students only)
 */
router.post(
  "/reviews",
  authenticate,
  authorize(Role.STUDENT),
  validate(createReviewSchema),
  reviewsController.createSchoolReview,
);

export { router as schoolReviewsRouter };
