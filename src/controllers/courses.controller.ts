import type { Request, Response, NextFunction } from "express";
import * as coursesService from "../services/courses.service.js";
import * as topicsService from "../services/topics.service.js";
import type { AuthUser } from "../types/auth.types.js";
import type {
  CreateCourseInput,
  UpdateCourseInput,
  QueryCoursesInput,
  CreateTopicInput,
  UpdateTopicInput,
} from "../validators/courses.schema.js";

/**
 * GET /courses
 * Public — paginated, searchable course catalog.
 */
export async function getAllCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await coursesService.getCourses(req.query as unknown as QueryCoursesInput);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /courses/:id
 * Public — full course with topics. Topic content is gated by enrollment for premium courses.
 */
export async function getCourseById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const course = await coursesService.getCourseById(id as string, req.user as AuthUser);
    res.json(course);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /courses
 * Protected — ADMIN, EDUCATION_HEAD, or SUPER_ADMIN only.
 */
export async function createCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const course = await coursesService.createCourse(
      req.body as CreateCourseInput,
      req.user as AuthUser,
    );
    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /courses/:id
 * Protected — ADMIN, EDUCATION_HEAD, or SUPER_ADMIN only.
 */
export async function updateCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const course = await coursesService.updateCourse(
      id as string,
      req.body as UpdateCourseInput,
      req.user as AuthUser,
    );
    res.json(course);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /courses/:id/price-recommendation
 * Protected — ADMIN, EDUCATION_HEAD, or SUPER_ADMIN only.
 * Returns an AI-computed price recommendation based on market data.
 */
export async function getPriceRecommendation(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const recommendation = await coursesService.getPriceRecommendation(id as string);
    res.json(recommendation);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /courses/:id/topics
 * Public — returns topic list. Content fields are stripped for non-enrolled users.
 */
export async function getTopics(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const topics = await topicsService.getTopicsByCourseId(
      id as string,
      req.user as AuthUser | undefined,
    );
    res.json(topics);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /courses/:id/topics
 * Protected — ADMIN, EDUCATION_HEAD, MENTOR, or SUPER_ADMIN only.
 */
export async function createTopic(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const topic = await topicsService.createTopic(
      id as string,
      req.body as CreateTopicInput,
      req.user as AuthUser,
    );
    res.status(201).json(topic);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /courses/:courseId/topics/:topicId
 * Protected — ADMIN, EDUCATION_HEAD, MENTOR, or SUPER_ADMIN only.
 */
export async function updateTopic(req: Request, res: Response, next: NextFunction) {
  try {
    const { topicId } = req.params;
    const topic = await topicsService.updateTopic(
      topicId as string,
      req.body as UpdateTopicInput,
      req.user as AuthUser,
    );
    res.json(topic);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /courses/:courseId/topics/:topicId
 * Protected — ADMIN, EDUCATION_HEAD, or SUPER_ADMIN only.
 */
export async function deleteTopic(req: Request, res: Response, next: NextFunction) {
  try {
    const { topicId } = req.params;
    const result = await topicsService.deleteTopic(
      topicId as string,
      req.user as AuthUser,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /courses/:courseId/publish-result
 */
export async function publishCourseResult(req: Request, res: Response, next: NextFunction) {
  try {
    const { courseId } = req.params;
    const { classroomId, studentId, finalExamScore } = req.body;
    const result = await coursesService.publishCourseResult(
      courseId as string,
      classroomId as string,
      studentId as string,
      finalExamScore ? Number(finalExamScore) : undefined,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /students/:id/progress
 */
export async function getStudentProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const progress = await coursesService.getStudentProgress(
      id as string,
      req.user as AuthUser,
    );
    res.json(progress);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /courses/recommended — Student course recommendations
 */
export async function getRecommendedCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const courses = await coursesService.getRecommendedCourses(req.user as AuthUser);
    res.json(courses);
  } catch (err) {
    next(err);
  }
}


