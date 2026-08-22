import { Router } from "express";
import * as quizzesController from "./quizzes.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { authorize } from "../../shared/middlewares/authorize.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  createQuizSchema,
  updateQuizSchema,
  submitQuizSchema,
} from "./quizzes.schema.js";
import { Role } from "../../shared/types/auth.types.js";

const router = Router();

// GET /quizzes — list quizzes
router.get("/", quizzesController.getQuizzes);

// GET /quizzes/:id — get quiz detail
router.get("/:id", authenticate, quizzesController.getQuizById);

// POST /quizzes — create quiz (Mentor, Education Head, Admin)
router.post(
  "/",
  authenticate,
  authorize(Role.MENTOR, Role.EDUCATION_HEAD, Role.ADMIN, Role.SUPER_ADMIN),
  validate(createQuizSchema),
  quizzesController.createQuiz,
);

// PATCH /quizzes/:id — update quiz
router.patch(
  "/:id",
  authenticate,
  authorize(Role.MENTOR, Role.EDUCATION_HEAD, Role.ADMIN, Role.SUPER_ADMIN),
  validate(updateQuizSchema),
  quizzesController.updateQuiz,
);

// POST /quizzes/:id/submit — submit and evaluate quiz responses
router.post(
  "/:id/submit",
  authenticate,
  validate(submitQuizSchema),
  quizzesController.submitQuiz,
);

export default router;
