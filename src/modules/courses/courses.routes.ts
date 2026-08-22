import { Router } from "express";
import * as coursesController from "./courses.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { authorize } from "../../shared/middlewares/authorize.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  createCourseSchema,
  updateCourseSchema,
  createTopicSchema,
  updateTopicSchema,
  queryCoursesSchema,
} from "./courses.schema.js";
import { Role } from "../../shared/types/auth.types.js";

const router = Router();

/**
 * Course routes
 */

// GET /courses — publicly browsable catalog
router.get(
  "/",
  validate(queryCoursesSchema, "query"),
  coursesController.getAllCourses,
);

// GET /courses/recommended — personalized course recommendations for student
router.get(
  "/recommended",
  authenticate,
  coursesController.getRecommendedCourses,
);

// GET /courses/:id — full course detail with (gated) topics
router.get("/:id", coursesController.getCourseById);

// POST /courses — create a course; ADMIN, EDUCATION_HEAD, SUPER_ADMIN
router.post(
  "/",
  authenticate,
  authorize(Role.ADMIN, Role.EDUCATION_HEAD, Role.SUPER_ADMIN),
  validate(createCourseSchema),
  coursesController.createCourse,
);

// PATCH /courses/:id — update a course
router.patch(
  "/:id",
  authenticate,
  authorize(Role.ADMIN, Role.EDUCATION_HEAD, Role.SUPER_ADMIN),
  validate(updateCourseSchema),
  coursesController.updateCourse,
);

// GET /courses/:id/price-recommendation — AI price suggestion (open to students & staff)
router.get(
  "/:id/price-recommendation",
  authenticate,
  coursesController.getPriceRecommendation,
);

/**
 * Topic routes (nested under a course)
 */

// GET /courses/:id/topics — list topics (content gated by enrollment)
router.get("/:id/topics", coursesController.getTopics);

// POST /courses/:id/topics — add a topic to a course
router.post(
  "/:id/topics",
  authenticate,
  authorize(Role.ADMIN, Role.EDUCATION_HEAD, Role.MENTOR, Role.SUPER_ADMIN),
  validate(createTopicSchema),
  coursesController.createTopic,
);

// PATCH /courses/:courseId/topics/:topicId — update a topic
router.patch(
  "/:courseId/topics/:topicId",
  authenticate,
  authorize(Role.ADMIN, Role.EDUCATION_HEAD, Role.MENTOR, Role.SUPER_ADMIN),
  validate(updateTopicSchema),
  coursesController.updateTopic,
);

// DELETE /courses/:courseId/topics/:topicId — delete a topic (re-sequences remaining)
router.delete(
  "/:courseId/topics/:topicId",
  authenticate,
  authorize(Role.ADMIN, Role.EDUCATION_HEAD, Role.SUPER_ADMIN),
  coursesController.deleteTopic,
);

// POST /courses/:courseId/publish-result — publish course result for a student
router.post(
  "/:courseId/publish-result",
  authenticate,
  authorize(Role.ADMIN, Role.EDUCATION_HEAD, Role.MENTOR, Role.SUPER_ADMIN),
  coursesController.publishCourseResult,
);

export default router;

// Sub-router mounted at /classrooms/:id (mergeParams)
export const classroomCoursesRouter = Router({ mergeParams: true });

/**
 * GET /classrooms/:id/courses
 */
classroomCoursesRouter.get(
  "/courses",
  authenticate,
  coursesController.getClassroomCourses,
);
