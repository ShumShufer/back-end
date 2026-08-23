import { z } from "zod";

/**
 * Schema for creating a new classroom (ADMIN, EDUCATION_HEAD)
 */
export const createClassroomSchema = z.object({
  name: z
    .string()
    .min(2, "Classroom name must be at least 2 characters")
    .max(100, "Classroom name must not exceed 100 characters"),
  schoolId: z.string().uuid("Invalid school ID format").optional(),
});

/**
 * Schema for updating an existing classroom (ADMIN, EDUCATION_HEAD)
 */
export const updateClassroomSchema = z.object({
  name: z
    .string()
    .min(2, "Classroom name must be at least 2 characters")
    .max(100, "Classroom name must not exceed 100 characters"),
});

/**
 * Schema for assigning a mentor to a classroom (EDUCATION_HEAD)
 */
export const assignMentorSchema = z.object({
  mentorId: z.string().uuid("Invalid mentor ID format"),
});

export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;
export type UpdateClassroomInput = z.infer<typeof updateClassroomSchema>;
export type AssignMentorInput = z.infer<typeof assignMentorSchema>;
