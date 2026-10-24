import { Router } from "express";
import * as topicsController from "./topics.controller.js";
import * as quizzesController from "../quizzes/quizzes.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { authorize } from "../../shared/middlewares/authorize.js";
import { validate } from "../../shared/middlewares/validate.js";
import { updateTopicSchema } from "./topics.schema.js";
import { createQuizSchema } from "../quizzes/quizzes.schema.js";
import { Role } from "../../shared/types/auth.types.js";

const router = Router();

/**
 * GET /topics/:id — get topic detail
 */
router.get("/:id", authenticate, topicsController.getTopicById);

/**
 * PATCH /topics/:id — edit topic (Mentor, Education Head, Admin)
 */
router.patch(
  "/:id",
  authenticate,
  authorize(Role.MENTOR, Role.EDUCATION_HEAD, Role.ADMIN, Role.SUPER_ADMIN),
  validate(updateTopicSchema),
  topicsController.updateTopic,
);

/**
 * DELETE /topics/:id — remove topic
 */
router.delete(
  "/:id",
  authenticate,
  authorize(Role.MENTOR, Role.EDUCATION_HEAD, Role.ADMIN, Role.SUPER_ADMIN),
  topicsController.deleteTopic,
);

/**
 * POST /topics/:id/quiz — create or replace topic quiz
 */
router.post(
  "/:id/quiz",
  authenticate,
  authorize(Role.MENTOR, Role.EDUCATION_HEAD, Role.ADMIN, Role.SUPER_ADMIN),
  validate(createQuizSchema.omit({ topicId: true })),
  quizzesController.createOrReplaceTopicQuiz,
);

export default router;
