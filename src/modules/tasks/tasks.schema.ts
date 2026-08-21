import { z } from "zod";

export const createTaskSchema = z.object({
  classroomId: z.string().uuid(),
  type: z.enum(["ASSIGNMENT", "QUIZ", "EXAM"]),
  title: z.string().min(3).max(150),
  description: z.string().max(3000).optional(),
  attachments: z.array(z.string().url()).optional().default([]),
  deadline: z.string().datetime(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  description: z.string().max(3000).optional(),
  attachments: z.array(z.string().url()).optional(),
  deadline: z.string().datetime().optional(),
});

export const queryTasksSchema = z.object({
  classroomId: z.string().uuid().optional(),
  type: z.enum(["ASSIGNMENT", "QUIZ", "EXAM"]).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type QueryTasksInput = z.infer<typeof queryTasksSchema>;
