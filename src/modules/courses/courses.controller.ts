import type { Request, Response, NextFunction } from "express";
import * as coursesService from "./courses.service.js";
import * as topicsService from "../topics/topics.service.js";
import { apiResponse } from "../../shared/helpers/apiResponse.js";
import type { AuthUser } from "../../shared/types/auth.types.js";
import type {
  CreateCourseInput,
  UpdateCourseInput,
  QueryCoursesInput,
  CreateTopicInput,
  UpdateTopicInput,
  AttachCourseInput,
  ConfigureFinalExamInput,
  SubmitFinalExamInput,
} from "./courses.schema.js";

/**
 * GET /courses
 * Public — paginated, searchable course catalog.
 */
export async function getAllCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await coursesService.getCourses(req.query as unknown as QueryCoursesInput);
    res.json(apiResponse(result.courses, "Courses retrieved successfully", 200, result.meta));
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
    res.json(apiResponse(course, "Course details retrieved successfully"));
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
    res.status(201).json(apiResponse(course, "Course created successfully", 201));
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
    res.json(apiResponse(course, "Course updated successfully"));
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /courses/:id
 * Protected — ADMIN, SUPER_ADMIN only.
 */
export async function deleteCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await coursesService.deleteCourse(id as string, req.user as AuthUser);
    res.json(apiResponse(result, "Course deleted successfully"));
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
    res.json(apiResponse(recommendation, "Price recommendation calculated successfully"));
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
    res.json(apiResponse(topics, "Course topics retrieved successfully"));
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
    res.status(201).json(apiResponse(topic, "Topic created successfully", 201));
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
    res.json(apiResponse(topic, "Topic updated successfully"));
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
    res.json(apiResponse(result, "Topic deleted successfully"));
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
      req.user as AuthUser,
    );
    res.json(apiResponse(result, "Course result published successfully"));
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
    res.json(apiResponse(progress, "Student progress retrieved successfully"));
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
    res.json(apiResponse(courses, "Recommended courses retrieved successfully"));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /classrooms/:id/courses — courses linked to a classroom
 */
export async function getClassroomCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const links = await coursesService.getClassroomCourses(id as string);
    res.json(apiResponse(links, "Classroom courses retrieved successfully"));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /classrooms/:id/courses — attach course to classroom
 */
export async function attachCourseToClassroom(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const link = await coursesService.attachCourseToClassroom(
      id as string,
      req.body as AttachCourseInput,
      req.user as AuthUser,
    );
    res.status(201).json(apiResponse(link, "Course attached to classroom successfully", 201));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /courses/:id/final-exam — configure final exam
 */
export async function configureFinalExam(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const exam = await coursesService.configureFinalExam(
      id as string,
      req.body as ConfigureFinalExamInput,
      req.user as AuthUser,
    );
    res.status(201).json(apiResponse(exam, "Final exam configured successfully", 201));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /courses/:id/final-exam/submit — submit final exam
 */
export async function submitFinalExam(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const result = await coursesService.submitFinalExam(
      id as string,
      req.body as SubmitFinalExamInput,
      req.user as AuthUser,
    );
    res.json(apiResponse(result, "Final exam submitted and evaluated successfully"));
  } catch (err) {
    next(err);
  }
}
