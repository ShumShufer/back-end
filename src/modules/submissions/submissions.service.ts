import prisma from "../../shared/config/db.js";
import { AppError } from "../../shared/helpers/appError.js";
import { Role, type AuthUser } from "../../shared/types/auth.types.js";
import type {
  CreateSubmissionInput,
  GradeSubmissionInput,
  QuerySubmissionsInput,
} from "./submissions.schema.js";

/**
 * Submit work for a task by a student.
 * Business Rules:
 * - Student must be enrolled in the classroom.
 * - Enforces deadline: Rejects if current timestamp > task.deadline.
 * - Allows upsert/re-submission before deadline.
 */
export async function submitTask(taskId: string, input: CreateSubmissionInput, actor: AuthUser) {
  if (actor.role !== Role.STUDENT) {
    throw AppError.forbidden("Only students can submit tasks");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { classroom: true },
  });

  if (!task) throw AppError.notFound("Task not found");

  // Check enrollment
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId: actor.id,
      classroomId: task.classroomId,
      status: "ACCEPTED",
    },
  });

  if (!enrollment) {
    throw AppError.forbidden("You are not enrolled in the classroom for this task");
  }

  // Enforce deadline
  if (new Date() > new Date(task.deadline)) {
    throw AppError.badRequest("Submission rejected: Deadline has passed");
  }

  // Check if a submission already exists
  const existingSubmission = await prisma.submission.findFirst({
    where: { taskId, studentId: actor.id },
  });

  if (existingSubmission) {
    // If already graded, cannot re-submit
    if (existingSubmission.grade !== null) {
      throw AppError.badRequest("Cannot re-submit: Your work has already been graded");
    }

    return prisma.submission.update({
      where: { id: existingSubmission.id },
      data: {
        attachments: input.attachments,
        submittedAt: new Date(),
      },
    });
  }

  return prisma.submission.create({
    data: {
      taskId,
      studentId: actor.id,
      attachments: input.attachments,
    },
  });
}

/**
 * Get submissions for a task.
 * Mentors/Admins see all student submissions. Students see only their own.
 */
export async function getSubmissions(query: QuerySubmissionsInput, actor: AuthUser) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (query.taskId) where.taskId = query.taskId;

  if (actor.role === Role.STUDENT) {
    where.studentId = actor.id;
  } else if (query.studentId) {
    where.studentId = query.studentId;
  }

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      skip,
      take: limit,
      orderBy: { submittedAt: "desc" },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, email: true } },
        task: { select: { id: true, title: true, type: true, deadline: true, classroomId: true } },
      },
    }),
    prisma.submission.count({ where }),
  ]);

  return {
    submissions,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Grade a student submission (Mentor / Admin / Education Head).
 * Business Rules:
 * - Updates grade (0-100), rich-text feedback, and timestamp.
 * - If task is an EXAM, auto-evaluates CourseResult (PASSED if grade >= 50, else FAILED).
 */
export async function gradeSubmission(
  submissionId: string,
  input: GradeSubmissionInput,
  actor: AuthUser,
) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      task: {
        include: {
          classroom: {
            include: { courses: true, mentors: true },
          },
        },
      },
    },
  });

  if (!submission) throw AppError.notFound("Submission not found");

  if (actor.role === Role.ADMIN && submission.task.classroom.schoolId !== actor.schoolId) {
    throw AppError.forbidden("You can only grade submissions for your school");
  }

  if (actor.role === Role.MENTOR) {
    const isMentor = submission.task.classroom.mentors.some((m) => m.mentorId === actor.id);
    if (!isMentor) throw AppError.forbidden("You are not assigned to mentor this classroom");
  }

  const updatedSubmission = await prisma.submission.update({
    where: { id: submissionId },
    data: {
      grade: input.grade,
      feedback: input.feedback ?? null,
      gradedAt: new Date(),
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, email: true } },
      task: true,
    },
  });

  // If this was an EXAM, evaluate course results for each course in the classroom
  if (submission.task.type === "EXAM") {
    const classroomCourses = submission.task.classroom.courses;
    const isPassed = input.grade >= 50;
    const status = isPassed ? "PASSED" : "FAILED";

    for (const cc of classroomCourses) {
      const existingResult = await prisma.courseResult.findFirst({
        where: {
          studentId: submission.studentId,
          courseId: cc.courseId,
          classroomId: submission.task.classroomId,
        },
      });

      if (existingResult) {
        await prisma.courseResult.update({
          where: { id: existingResult.id },
          data: {
            status,
            finalExamScore: input.grade,
            publishedAt: new Date(),
          },
        });
      } else {
        await prisma.courseResult.create({
          data: {
            studentId: submission.studentId,
            courseId: cc.courseId,
            classroomId: submission.task.classroomId,
            status,
            finalExamScore: input.grade,
            publishedAt: new Date(),
          },
        });
      }
    }
  }

  return updatedSubmission;
}
