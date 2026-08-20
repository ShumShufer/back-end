import { Router } from "express";
import * as quizzesController from "../controllers/quizzes.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { validate } from "../middlewares/validate.js";
import {
  createQuizSchema,
  updateQuizSchema,
  submitQuizSchema,
} from "../validators/quizzes.schema.js";
import { Role } from "../types/auth.types.js";

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
