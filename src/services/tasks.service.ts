import prisma from "../config/db.js";
import { AppError } from "../helpers/appError.js";
import { Role, type AuthUser } from "../types/auth.types.js";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  QueryTasksInput,
} from "../validators/tasks.schema.js";

/**
 * Get tasks for a classroom with role-aware access controls.
 * - Students can only query classrooms they are currently enrolled in (ACCEPTED status).
 * - Mentors can only query classrooms they mentor (or are assigned to).
 */
export async function getTasks(query: QueryTasksInput, actor: AuthUser) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (query.type) where.type = query.type;

  if (query.classroomId) {
    where.classroomId = query.classroomId;

    // Authorization checks for specific classroom
    if (actor.role === Role.STUDENT) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: actor.id,
          classroomId: query.classroomId,
          status: "ACCEPTED",
        },
      });
      if (!enrollment) {
        throw AppError.forbidden("You are not enrolled in this classroom");
      }
    }
  } else if (actor.role === Role.STUDENT) {
    // If no classroom specified, restrict to all classrooms student is enrolled in
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: actor.id, status: "ACCEPTED", classroomId: { not: null } },
      select: { classroomId: true },
    });
    const classroomIds = enrollments.map((e) => e.classroomId!).filter(Boolean);
    where.classroomId = { in: classroomIds };
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: { deadline: "asc" },
      include: {
        classroom: { select: { id: true, name: true, schoolId: true } },
        _count: { select: { submissions: true } },
      },
    }),
    prisma.task.count({ where }),
  ]);

  return {
    tasks,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Get a single task by ID.
 * Returns task details and, if the actor is a student, includes their existing submission.
 */
export async function getTaskById(taskId: string, actor: AuthUser) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      classroom: { select: { id: true, name: true, schoolId: true } },
      submissions:
        actor.role === Role.STUDENT
          ? {
              where: { studentId: actor.id },
              take: 1,
            }
          : {
              include: {
                student: { select: { id: true, firstName: true, lastName: true, email: true } },
              },
            },
    },
  });

  if (!task) throw AppError.notFound("Task not found");

  if (actor.role === Role.STUDENT) {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: actor.id,
        classroomId: task.classroomId,
        status: "ACCEPTED",
      },
    });
    if (!enrollment) throw AppError.forbidden("You are not enrolled in this classroom");
  }

  return task;
}

/**
 * Create a task (ASSIGNMENT, QUIZ, or EXAM) with a deadline.
 * MENTOR, EDUCATION_HEAD, ADMIN, SUPER_ADMIN
 */
export async function createTask(input: CreateTaskInput, actor: AuthUser) {
  const classroom = await prisma.classroom.findUnique({
    where: { id: input.classroomId },
    include: { mentors: true },
  });

  if (!classroom) throw AppError.notFound("Classroom not found");

  if (actor.role === Role.ADMIN && classroom.schoolId !== actor.schoolId) {
    throw AppError.forbidden("You can only create tasks for classrooms in your school");
  }

  if (actor.role === Role.MENTOR) {
    const isMentor = classroom.mentors.some((m) => m.mentorId === actor.id);
    if (!isMentor) throw AppError.forbidden("You are not assigned as a mentor to this classroom");
  }

  const deadlineDate = new Date(input.deadline);
  if (deadlineDate <= new Date()) {
    throw AppError.badRequest("Deadline must be in the future");
  }

  return prisma.task.create({
    data: {
      classroomId: input.classroomId,
      createdById: actor.id,
      type: input.type,
      title: input.title,
      description: input.description ?? null,
      attachments: input.attachments ?? [],
      deadline: deadlineDate,
    },
    include: {
      classroom: { select: { id: true, name: true } },
    },
  });
}

/**
 * Update task metadata, attachments, or deadline.
 */
export async function updateTask(taskId: string, input: UpdateTaskInput, actor: AuthUser) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { classroom: { include: { mentors: true } } },
  });

  if (!task) throw AppError.notFound("Task not found");

  if (actor.role === Role.ADMIN && task.classroom.schoolId !== actor.schoolId) {
    throw AppError.forbidden("You can only update tasks in your school");
  }

  if (actor.role === Role.MENTOR) {
    const isMentor = task.classroom.mentors.some((m) => m.mentorId === actor.id);
    if (!isMentor && task.createdById !== actor.id) {
      throw AppError.forbidden("You do not have permission to update this task");
    }
  }

  let deadlineDate: Date | undefined;
  if (input.deadline) {
    deadlineDate = new Date(input.deadline);
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.description !== undefined && { description: input.description ?? null }),
      ...(input.attachments && { attachments: input.attachments }),
      ...(deadlineDate && { deadline: deadlineDate }),
    },
  });
}

/**
 * Delete a task and its submissions.
 */
export async function deleteTask(taskId: string, actor: AuthUser) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { classroom: true },
  });

  if (!task) throw AppError.notFound("Task not found");

  if (actor.role === Role.ADMIN && task.classroom.schoolId !== actor.schoolId) {
    throw AppError.forbidden("You can only delete tasks in your school");
  }

  await prisma.submission.deleteMany({ where: { taskId } });
  await prisma.task.delete({ where: { id: taskId } });

  return { message: "Task deleted successfully" };
}
