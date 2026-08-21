import { z } from "zod";

export const createStudentReportSchema = z.object({
  reportedStudentId: z.string().uuid(),
  note: z.string().min(5).max(2000),
});

export type CreateStudentReportInput = z.infer<typeof createStudentReportSchema>;
