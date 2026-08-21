import { z } from "zod";

export const createScheduleSchema = z.object({
  schoolId: z.string().uuid().optional(),
  classroomId: z.string().uuid().optional(),
  scope: z.enum(["SCHOOL", "CLASSROOM"]),
  title: z.string().min(3).max(150),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().max(200).optional(),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: "endTime must be after startTime",
  path: ["endTime"],
});

export const updateScheduleSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  location: z.string().max(200).optional(),
});

export const querySchedulesSchema = z.object({
  schoolId: z.string().uuid().optional(),
  classroomId: z.string().uuid().optional(),
  scope: z.enum(["SCHOOL", "CLASSROOM"]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type QuerySchedulesInput = z.infer<typeof querySchedulesSchema>;
