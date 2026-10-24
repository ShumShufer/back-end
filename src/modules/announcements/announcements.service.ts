import prisma from "../../shared/config/db.js";
import { AppError } from "../../shared/helpers/appError.js";
import { Role, type AuthUser } from "../../shared/types/auth.types.js";
import { dispatchNotification } from "../../shared/helpers/notificationDispatcher.js";
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

  const announcement = await prisma.announcement.create({
    data: {
      schoolId: null,
      classroomId: null,
      authorId: actor.id,
      title: input.title.trim(),
      body: input.body.trim(),
      audience: "PUBLIC",
    },
  });

  // Fan out notification to all registered users on the platform
  const users = await prisma.user.findMany({ select: { id: true } });
  if (users.length > 0) {
    await dispatchNotification({
      topic: "SCHOOL_ANNOUNCEMENT",
      title: announcement.title,
      body: announcement.body,
      recipientUserIds: users.map((u) => u.id),
      relatedEntityId: announcement.id,
    });
  }

  return announcement;
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

  const announcement = await prisma.announcement.create({
    data: {
      schoolId,
      classroomId: null,
      authorId: actor.id,
      title: input.title.trim(),
      body: input.body.trim(),
      audience: "PUBLIC",
    },
  });

  // Fan out notification to all school users
  const schoolUsers = await prisma.user.findMany({
    where: { schoolId },
    select: { id: true },
  });
  if (schoolUsers.length > 0) {
    await dispatchNotification({
      topic: "SCHOOL_ANNOUNCEMENT",
      title: announcement.title,
      body: announcement.body,
      recipientUserIds: schoolUsers.map((u) => u.id),
      relatedEntityId: announcement.id,
    });
  }

  return announcement;
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

  const announcement = await prisma.announcement.create({
    data: {
      schoolId: classroom.schoolId,
      classroomId,
      authorId: actor.id,
      title: input.title.trim(),
      body: input.body.trim(),
      audience: "CLASSROOM",
    },
  });

  // Fan out to classroom students and mentors
  const [enrollments, mentors] = await Promise.all([
    prisma.enrollment.findMany({
      where: { classroomId, status: "ACCEPTED" },
      select: { studentId: true },
    }),
    prisma.classroomMentor.findMany({
      where: { classroomId },
      select: { mentorId: true },
    }),
  ]);

  const recipientIds = [
    ...enrollments.map((e) => e.studentId),
    ...mentors.map((m) => m.mentorId),
  ];

  if (recipientIds.length > 0) {
    await dispatchNotification({
      topic: "CLASSROOM",
      title: announcement.title,
      body: announcement.body,
      recipientUserIds: recipientIds,
      relatedEntityId: announcement.id,
    });
  }

  return announcement;
}

export async function updateAnnouncement(
  id: string,
  input: { title?: string; body?: string },
  actor: AuthUser,
) {
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) throw AppError.notFound("Announcement not found");

  if (actor.role !== Role.SUPER_ADMIN && existing.authorId !== actor.id) {
    throw AppError.forbidden("You cannot edit this announcement");
  }

  return prisma.announcement.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.body !== undefined && { body: input.body.trim() }),
    },
  });
}

export async function deleteAnnouncement(id: string, actor: AuthUser) {
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) throw AppError.notFound("Announcement not found");

  if (actor.role !== Role.SUPER_ADMIN && existing.authorId !== actor.id) {
    throw AppError.forbidden("You cannot delete this announcement");
  }

  await prisma.announcement.delete({ where: { id } });
  return { success: true };
}
