import { z } from "zod";

export const createNotificationSchema = z.object({
  topic: z.enum([
    "SCHOOL_ANNOUNCEMENT",
    "STAFF_POST",
    "CLASSROOM",
    "APPLICATION",
    "TASK",
    "RESULT",
    "PAYMENT",
    "SYSTEM",
  ]),
  title: z.string().min(3).max(150),
  body: z.string().min(3).max(2000),
  recipientUserIds: z.array(z.string().uuid()).min(1),
  relatedEntityId: z.string().uuid().optional(),
});

export const queryNotificationsSchema = z.object({
  topic: z.enum([
    "SCHOOL_ANNOUNCEMENT",
    "STAFF_POST",
    "CLASSROOM",
    "APPLICATION",
    "TASK",
    "RESULT",
    "PAYMENT",
    "SYSTEM",
  ]).optional(),
  unreadOnly: z.enum(["true", "false"]).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type QueryNotificationsInput = z.infer<typeof queryNotificationsSchema>;
