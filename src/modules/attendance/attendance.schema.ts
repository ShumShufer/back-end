import { z } from "zod";

export const attendanceRecordItemSchema = z.object({
  studentId: z.string().uuid(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
});

export const createAttendanceSessionSchema = z.object({
  classroomId: z.string().uuid(),
  date: z.string().datetime().optional(),
  records: z.array(attendanceRecordItemSchema).optional(),
});

export const recordAttendanceBulkSchema = z.object({
  records: z.array(attendanceRecordItemSchema).min(1, "At least one record is required"),
});

export const queryAttendanceSchema = z.object({
  classroomId: z.string().uuid(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type CreateAttendanceSessionInput = z.infer<typeof createAttendanceSessionSchema>;
export type RecordAttendanceBulkInput = z.infer<typeof recordAttendanceBulkSchema>;
export type QueryAttendanceInput = z.infer<typeof queryAttendanceSchema>;
