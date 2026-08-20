import { Router } from "express";
import * as reviewsController from "../controllers/reviews.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import { createReviewSchema, queryReviewsSchema } from "../validators/reviews.schema.js";
import { Role } from "../types/auth.types.js";

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
