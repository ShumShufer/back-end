import { z } from "zod";

export const createCourseSchema = z.object({
  schoolId: z.string().uuid().optional(),
  title: z.string().min(3).max(100),
  description: z.string().max(1000).optional(),
  price: z.number().min(0),
  isFree: z.boolean().default(false),
});

export const updateCourseSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(1000).optional(),
  price: z.number().min(0).optional(),
  isFree: z.boolean().optional(),
});

export const createTopicSchema = z.object({
  title: z.string().min(3).max(100),
  order: z.number().int().min(1),
  videoUrl: z.string().url().optional(),
  content: z.string().max(5000).optional(),
});

export const updateTopicSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  order: z.number().int().min(1).optional(),
  videoUrl: z.string().url().optional(),
  content: z.string().max(5000).optional(),
});

export const queryCoursesSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  schoolId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export const attachCourseSchema = z.object({
  courseId: z.string().uuid("Invalid course ID"),
  order: z.number().int().min(1).optional(),
  mandatory: z.boolean().optional(),
});

export const configureFinalExamSchema = z.object({
  title: z.string().min(3).max(100),
  questions: z.array(
    z.object({
      id: z.string().optional(),
      question: z.string().min(1),
      options: z.array(z.string().min(1)).min(2),
      correctOptionIndex: z.number().int().min(0),
      points: z.number().int().min(1).optional(),
    }),
  ).min(1),
  passScore: z.number().int().min(1).max(100),
});

export const submitFinalExamSchema = z.object({
  classroomId: z.string().uuid("Invalid classroom ID"),
  answers: z.array(
    z.object({
      questionIndex: z.number().int().min(0),
      selectedOptionIndex: z.number().int().min(0),
    }),
  ),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
export type QueryCoursesInput = z.infer<typeof queryCoursesSchema>;
export type AttachCourseInput = z.infer<typeof attachCourseSchema>;
export type ConfigureFinalExamInput = z.infer<typeof configureFinalExamSchema>;
export type SubmitFinalExamInput = z.infer<typeof submitFinalExamSchema>;
