import { z } from "zod";

export const createSubmissionSchema = z.object({
  attachments: z.array(z.string().url()).min(1, "At least one attachment URL is required"),
});

export const gradeSubmissionSchema = z.object({
  grade: z.number().min(0).max(100),
  feedback: z.string().max(2000).optional(),
});

export const querySubmissionsSchema = z.object({
  taskId: z.string().uuid().optional(),
  studentId: z.string().uuid().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
export type QuerySubmissionsInput = z.infer<typeof querySubmissionsSchema>;
