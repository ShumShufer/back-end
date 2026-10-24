import { z } from "zod";

export const createScheduleSchema = z.object({
  schoolId: z.string().uuid().nullable().optional(),
  classroomId: z.string().uuid().nullable().optional(),
  scope: z.enum(["SCHOOL", "CLASSROOM"]),
  title: z.string().min(3).max(150),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().max(200).nullable().optional(),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: "endTime must be after startTime",
  path: ["endTime"],
});

export const updateScheduleSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  location: z.string().max(200).nullable().optional(),
});

export const querySchedulesSchema = z.object({
  schoolId: z.string().uuid().or(z.literal("")).transform((v) => (v ? v : undefined)).optional(),
  classroomId: z.string().uuid().or(z.literal("")).transform((v) => (v ? v : undefined)).optional(),
  scope: z.enum(["SCHOOL", "CLASSROOM"]).or(z.literal("")).transform((v) => (v ? (v as "SCHOOL" | "CLASSROOM") : undefined)).optional(),
  from: z.string().datetime().or(z.literal("")).transform((v) => (v ? v : undefined)).optional(),
  to: z.string().datetime().or(z.literal("")).transform((v) => (v ? v : undefined)).optional(),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type QuerySchedulesInput = z.infer<typeof querySchedulesSchema>;
