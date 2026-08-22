import { z } from "zod";

/**
 * Platform-wide announcements are school-less and classroom-less rows.
 */
export const createPlatformAnnouncementSchema = z.object({
  title: z.string().min(3).max(150),
  body: z.string().min(3).max(2000),
});

export const createSchoolAnnouncementSchema = z.object({
  title: z.string().min(3).max(150),
  body: z.string().min(3).max(2000),
});

export type CreatePlatformAnnouncementInput = z.infer<
  typeof createPlatformAnnouncementSchema
>;
export type CreateSchoolAnnouncementInput = z.infer<
  typeof createSchoolAnnouncementSchema
>;

export const createClassroomAnnouncementSchema = z.object({
  title: z.string().min(3).max(150),
  body: z.string().min(3).max(2000),
});

export type CreateClassroomAnnouncementInput = z.infer<
  typeof createClassroomAnnouncementSchema
>;
