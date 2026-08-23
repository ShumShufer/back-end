import { z } from "zod";

export const createResourceSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(["PDF", "PPT", "VIDEO", "LINK"]),
  url: z.string().url(),
  mandatory: z.boolean().optional(),
  topicId: z.string().uuid().nullable().optional(),
});

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
