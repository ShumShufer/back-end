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

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
export type QueryCoursesInput = z.infer<typeof queryCoursesSchema>;
