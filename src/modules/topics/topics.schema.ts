import { z } from "zod";

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

export type CreateTopicInput = z.infer<typeof createTopicSchema>;
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;
