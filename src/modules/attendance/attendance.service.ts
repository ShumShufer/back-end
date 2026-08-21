import prisma from "../../shared/config/db.js";
import { AppError } from "../../shared/helpers/appError.js";
import { Role, type AuthUser } from "../../shared/types/auth.types.js";
import type {
  CreateAttendanceSessionInput,
  RecordAttendanceBulkInput,
  QueryAttendanceInput,
} from "./attendance.schema.js";

/**
 * Create an attendance session for a classroom date and optionally record attendance.
 */
export async function createAttendanceSession(
  input: CreateAttendanceSessionInput,
  actor: AuthUser,
) {
  if (actor.role === Role.STUDENT) {
    throw AppError.forbidden("Students cannot create attendance sessions");
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: input.classroomId },
    include: { mentors: true },
  });

  if (!classroom) throw AppError.notFound("Classroom not found");

  if (actor.role === Role.MENTOR) {
    const isMentor = classroom.mentors.some((m) => m.mentorId === actor.id);
    if (!isMentor) throw AppError.forbidden("You are not assigned to this classroom");
  }

  const sessionDate = input.date ? new Date(input.date) : new Date();

  return prisma.attendanceSession.create({
    data: {
      classroomId: input.classroomId,
      date: sessionDate,
      ...(input.records && input.records.length > 0
        ? {
            records: {
              create: input.records.map((r) => ({
                studentId: r.studentId,
                status: r.status,
              })),
            },
          }
        : {}),
    },
    include: {
      classroom: { select: { id: true, name: true } },
      records: {
        include: {
          student: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
  });
}

/**
 * Mark/update attendance records in bulk for a session.
 */
export async function recordBulkAttendance(
  sessionId: string,
  input: RecordAttendanceBulkInput,
  actor: AuthUser,
) {
  if (actor.role === Role.STUDENT) {
    throw AppError.forbidden("Students cannot mark attendance");
  }

  const session = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: { classroom: { include: { mentors: true } } },
  });

  if (!session) throw AppError.notFound("Attendance session not found");

  if (actor.role === Role.MENTOR) {
    const isMentor = session.classroom.mentors.some((m) => m.mentorId === actor.id);
    if (!isMentor) throw AppError.forbidden("You are not assigned to this classroom");
  }

  // Upsert each record
  for (const record of input.records) {
    const existing = await prisma.attendanceRecord.findFirst({
      where: { sessionId, studentId: record.studentId },
    });

    if (existing) {
      await prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: { status: record.status },
      });
    } else {
      await prisma.attendanceRecord.create({
        data: {
          sessionId,
          studentId: record.studentId,
          status: record.status,
        },
      });
    }
  }

  return prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: {
      records: {
        include: {
          student: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
  });
}

/**
 * Get attendance sessions for a classroom.
 */
export async function getAttendanceSessions(query: QueryAttendanceInput, actor: AuthUser) {
  const where: Record<string, unknown> = {
    classroomId: query.classroomId,
  };

  if (query.from || query.to) {
    where.date = {
      ...(query.from && { gte: new Date(query.from) }),
      ...(query.to && { lte: new Date(query.to) }),
    };
  }

  return prisma.attendanceSession.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      records: {
        ...(actor.role === Role.STUDENT ? { where: { studentId: actor.id } } : {}),
        include: {
          student: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
      _count: { select: { records: true } },
    },
  });
}
