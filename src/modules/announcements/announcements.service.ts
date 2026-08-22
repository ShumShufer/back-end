import prisma from "../../shared/config/db.js";
import { AppError } from "../../shared/helpers/appError.js";
import { Role, type AuthUser } from "../../shared/types/auth.types.js";
import type {
  CreateClassroomAnnouncementInput,
  CreatePlatformAnnouncementInput,
  CreateSchoolAnnouncementInput,
} from "./announcements.schema.js";

/**
 * Platform-wide announcements (SUPER_ADMIN).
 * Stored with no school and no classroom so they are publicly visible.
 */
export async function broadcastPlatformAnnouncement(
  input: CreatePlatformAnnouncementInput,
  actor: AuthUser,
) {
  if (actor.role !== Role.SUPER_ADMIN) {
    throw AppError.forbidden("Only platform admins can post announcements");
  }

  return prisma.announcement.create({
    data: {
      schoolId: null,
      classroomId: null,
      authorId: actor.id,
      title: input.title.trim(),
      body: input.body.trim(),
      audience: "PUBLIC",
    },
  });
}

/**
 * Public platform announcement feed, newest first.
 */
export async function getPlatformAnnouncements() {
  return prisma.announcement.findMany({
    where: { schoolId: null, classroomId: null },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

/**
 * School-scoped announcements (ADMIN posts, everyone may read).
 */
export async function getSchoolAnnouncements(schoolId: string) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw AppError.notFound("School not found");

  return prisma.announcement.findMany({
    where: { schoolId, classroomId: null },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function broadcastSchoolAnnouncement(
  schoolId: string,
  input: CreateSchoolAnnouncementInput,
  actor: AuthUser,
) {
  if (actor.role !== Role.ADMIN && actor.role !== Role.SUPER_ADMIN) {
    throw AppError.forbidden("Only school admins can post announcements");
  }
  if (
    actor.role === Role.ADMIN &&
    actor.schoolId !== schoolId
  ) {
    throw AppError.forbidden("You can only post announcements for your school");
  }

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw AppError.notFound("School not found");

  return prisma.announcement.create({
    data: {
      schoolId,
      classroomId: null,
      authorId: actor.id,
      title: input.title.trim(),
      body: input.body.trim(),
      audience: "PUBLIC",
    },
  });
}

/**
 * Classroom-scoped announcements (MENTOR / EDUCATION_HEAD / ADMIN post).
 */
export async function getClassroomAnnouncements(classroomId: string) {
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom) throw AppError.notFound("Classroom not found");

  return prisma.announcement.findMany({
    where: { classroomId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function broadcastClassroomAnnouncement(
  classroomId: string,
  input: CreateClassroomAnnouncementInput,
  actor: AuthUser,
) {
  if (
    actor.role !== Role.ADMIN &&
    actor.role !== Role.EDUCATION_HEAD &&
    actor.role !== Role.MENTOR &&
    actor.role !== Role.SUPER_ADMIN
  ) {
    throw AppError.forbidden("Only staff can post classroom announcements");
  }

  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom) throw AppError.notFound("Classroom not found");

  if (actor.role !== Role.SUPER_ADMIN && actor.schoolId && actor.schoolId !== classroom.schoolId) {
    throw AppError.forbidden("You can only post announcements for your school");
  }

  return prisma.announcement.create({
    data: {
      schoolId: classroom.schoolId,
      classroomId,
      authorId: actor.id,
      title: input.title.trim(),
      body: input.body.trim(),
      audience: "CLASSROOM",
    },
  });
}
