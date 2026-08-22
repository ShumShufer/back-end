import { z } from "zod";

export const quizQuestionSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctOptionIndex: z.number().int().min(0),
  points: z.number().int().min(1).default(1),
});

export const createQuizSchema = z.object({
  topicId: z.string().uuid().optional(),
  title: z.string().min(3).max(150),
  questions: z.array(quizQuestionSchema).min(1, "At least one question is required"),
  passScore: z.number().int().min(1).max(100),
});

export const updateQuizSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  questions: z.array(quizQuestionSchema).min(1).optional(),
  passScore: z.number().int().min(1).max(100).optional(),
});

export const submitQuizSchema = z.object({
  answers: z.array(
    z.object({
      questionIndex: z.number().int().min(0),
      selectedOptionIndex: z.number().int().min(0),
    }),
  ),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
