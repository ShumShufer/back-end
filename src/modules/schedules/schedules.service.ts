import prisma from "../../shared/config/db.js";
import { AppError } from "../../shared/helpers/appError.js";
import { Role, type AuthUser } from "../../shared/types/auth.types.js";
import type {
  CreateScheduleInput,
  UpdateScheduleInput,
  QuerySchedulesInput,
} from "./schedules.schema.js";

// Role priority map for schedule override rules
const ROLE_PRIORITY: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 4,
  [Role.ADMIN]: 3,
  [Role.EDUCATION_HEAD]: 2,
  [Role.MENTOR]: 1,
  [Role.STUDENT]: 0,
};

/**
 * List schedule events for a school or classroom.
 */
export async function getScheduleEvents(query: QuerySchedulesInput, actor: AuthUser) {
  const where: Record<string, unknown> = {};

  if (query.scope) where.scope = query.scope;
  if (query.schoolId) where.schoolId = query.schoolId;
  if (query.classroomId) where.classroomId = query.classroomId;

  if (query.from || query.to) {
    where.startTime = {
      ...(query.from && { gte: new Date(query.from) }),
      ...(query.to && { lte: new Date(query.to) }),
    };
  }

  // Student visibility: only their school and enrolled classrooms
  if (actor.role === Role.STUDENT) {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: actor.id, status: "ACCEPTED" },
      select: { schoolId: true, classroomId: true },
    });

    const schoolIds = enrollments.map((e) => e.schoolId);
    const classroomIds = enrollments.map((e) => e.classroomId!).filter(Boolean);

    where.OR = [
      { schoolId: { in: schoolIds }, scope: "SCHOOL" },
      { classroomId: { in: classroomIds }, scope: "CLASSROOM" },
    ];
  }

  return prisma.scheduleEvent.findMany({
    where,
    orderBy: { startTime: "asc" },
    include: {
      school: { select: { id: true, name: true } },
      classroom: { select: { id: true, name: true } },
    },
  });
}

/**
 * Get a single schedule event.
 */
export async function getScheduleEventById(eventId: string) {
  const event = await prisma.scheduleEvent.findUnique({
    where: { id: eventId },
    include: {
      school: { select: { id: true, name: true } },
      classroom: { select: { id: true, name: true } },
    },
  });

  if (!event) throw AppError.notFound("Schedule event not found");

  return event;
}

/**
 * Create a new schedule event.
 * MENTOR, EDUCATION_HEAD, ADMIN, SUPER_ADMIN
 */
export async function createScheduleEvent(input: CreateScheduleInput, actor: AuthUser) {
  if (actor.role === Role.STUDENT) {
    throw AppError.forbidden("Students cannot create schedule events");
  }

  const startTime = new Date(input.startTime);
  const endTime = new Date(input.endTime);

  let schoolId = input.schoolId;
  if (input.scope === "CLASSROOM") {
    if (!input.classroomId) {
      throw AppError.badRequest("classroomId is required for CLASSROOM scope schedule");
    }
    const classroom = await prisma.classroom.findUnique({
      where: { id: input.classroomId },
      include: { mentors: true },
    });
    if (!classroom) throw AppError.notFound("Classroom not found");

    if (actor.role === Role.MENTOR) {
      const isMentor = classroom.mentors.some((m) => m.mentorId === actor.id);
      if (!isMentor) throw AppError.forbidden("You are not a mentor of this classroom");
    }
    schoolId = classroom.schoolId;
  } else if (input.scope === "SCHOOL") {
    if (!schoolId && actor.schoolId) {
      schoolId = actor.schoolId;
    }
    if (!schoolId && actor.role !== Role.SUPER_ADMIN) {
      throw AppError.badRequest("schoolId is required for SCHOOL scope schedule");
    }
    // Mentors cannot create school-wide schedules
    if (actor.role === Role.MENTOR) {
      throw AppError.forbidden("Mentors cannot create school-wide schedules");
    }
  }

  return prisma.scheduleEvent.create({
    data: {
      schoolId: schoolId ?? null,
      classroomId: input.classroomId ?? null,
      scope: input.scope,
      createdByRole: actor.role,
      title: input.title,
      startTime,
      endTime,
      location: input.location ?? null,
    },
    include: {
      classroom: { select: { id: true, name: true } },
      school: { select: { id: true, name: true } },
    },
  });
}

/**
 * Update schedule event with Priority Rule Enforcement:
 * Lower priority roles (e.g. MENTOR) cannot override events created by higher priority roles (e.g. ADMIN/EDUCATION_HEAD).
 */
export async function updateScheduleEvent(
  eventId: string,
  input: UpdateScheduleInput,
  actor: AuthUser,
) {
  const event = await prisma.scheduleEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) throw AppError.notFound("Schedule event not found");

  const actorPriority = ROLE_PRIORITY[actor.role] ?? 0;
  const creatorPriority = ROLE_PRIORITY[event.createdByRole] ?? 0;

  // Priority Rule Check
  if (actorPriority < creatorPriority) {
    throw new AppError(
      "This schedule was created by a higher authority and is locked from modification",
      403,
      "SCHEDULE_LOCKED",
    );
  }

  return prisma.scheduleEvent.update({
    where: { id: eventId },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.startTime && { startTime: new Date(input.startTime) }),
      ...(input.endTime && { endTime: new Date(input.endTime) }),
      ...(input.location !== undefined && { location: input.location ?? null }),
    },
  });
}

/**
 * Delete schedule event with Priority Rule Enforcement.
 */
export async function deleteScheduleEvent(eventId: string, actor: AuthUser) {
  const event = await prisma.scheduleEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) throw AppError.notFound("Schedule event not found");

  const actorPriority = ROLE_PRIORITY[actor.role] ?? 0;
  const creatorPriority = ROLE_PRIORITY[event.createdByRole] ?? 0;

  if (actorPriority < creatorPriority) {
    throw new AppError(
      "This schedule was created by a higher authority and cannot be deleted by a lower role",
      403,
      "SCHEDULE_LOCKED",
    );
  }

  await prisma.scheduleEvent.delete({ where: { id: eventId } });

  return { message: "Schedule event deleted successfully" };
}
