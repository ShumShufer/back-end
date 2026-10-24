import prisma from "../../shared/config/db.js";
import { AppError } from "../../shared/helpers/appError.js";
import { Role, type AuthUser } from "../../shared/types/auth.types.js";

/**
 * Course results for a student. Students may only read their own;
 * staff (any school) and SUPER_ADMIN may read any.
 */
export async function getStudentProgress(studentId: string, actor: AuthUser) {
  if (actor.role === Role.STUDENT && actor.id !== studentId) {
    throw AppError.forbidden("Students can only view their own progress");
  }

  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student) throw AppError.notFound("Student not found");

  return prisma.courseResult.findMany({
    where: { studentId },
    orderBy: { courseId: "asc" },
  });
}

/**
 * Generates a comprehensive performance report for a student:
 * including attendance percentage, assignment grades, and course results.
 */
export async function getStudentPerformanceReport(studentId: string, actor: AuthUser) {
  if (actor.role === Role.STUDENT && actor.id !== studentId) {
    throw AppError.forbidden("Students can only view their own performance report");
  }

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatarUrl: true,
      verificationStatus: true,
      school: {
        select: { id: true, name: true },
      },
    },
  });

  if (!student) throw AppError.notFound("Student not found");

  const [courseResults, submissions, attendanceRecords] = await Promise.all([
    prisma.courseResult.findMany({
      where: { studentId },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.submission.findMany({
      where: { studentId },
      include: {
        task: {
          select: { id: true, title: true, type: true, deadline: true },
        },
      },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.attendanceRecord.findMany({
      where: { studentId },
      include: {
        session: { select: { date: true, classroomId: true } },
      },
      orderBy: { session: { date: "desc" } },
    }),
  ]);

  const gradedSubmissions = submissions.filter((s) => s.grade !== null);
  const averageGrade =
    gradedSubmissions.length > 0
      ? Math.round(
          (gradedSubmissions.reduce((sum, s) => sum + (s.grade ?? 0), 0) /
            gradedSubmissions.length) *
            10,
        ) / 10
      : null;

  const totalSessions = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const attendanceRate =
    totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;

  const passedCourses = courseResults.filter((r) => r.status === "PASSED").length;

  return {
    student,
    summary: {
      totalCoursesEnrolled: courseResults.length,
      passedCourses,
      tasksSubmitted: submissions.length,
      gradedTasks: gradedSubmissions.length,
      averageGrade,
      attendanceRate,
      totalAttendanceSessions: totalSessions,
      isEligibleForGraduation: passedCourses > 0 && attendanceRate >= 75,
    },
    courseResults,
    recentSubmissions: submissions.slice(0, 10),
    attendanceHistory: attendanceRecords.slice(0, 20),
  };
}

/**
 * Get submissions for a student with pagination and role-based access check.
 */
export async function getStudentSubmissions(
  studentId: string,
  actor: AuthUser,
  page = 1,
  limit = 20,
) {
  if (actor.role === Role.STUDENT && actor.id !== studentId) {
    throw AppError.forbidden("You can only view your own submission history");
  }

  const skip = (page - 1) * limit;
  const where = { studentId };

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      skip,
      take: limit,
      orderBy: { submittedAt: "desc" },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            type: true,
            deadline: true,
            classroomId: true,
          },
        },
      },
    }),
    prisma.submission.count({ where }),
  ]);

  return {
    submissions,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}
