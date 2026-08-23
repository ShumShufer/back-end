import prisma from "../../shared/config/db.js";
import { AppError } from "../../shared/helpers/appError.js";
import { Role, type AuthUser } from "../../shared/types/auth.types.js";

// ─── Super Admin Dashboard ───────────────────────────────────────────────────

/**
 * GET /admin/dashboard
 * Platform-wide metrics for SUPER_ADMIN.
 */
export async function getSuperAdminDashboard(actor: AuthUser) {
  if (actor.role !== Role.SUPER_ADMIN) {
    throw AppError.forbidden("Only Super Admins can view the platform dashboard");
  }

  const [
    totalSchools,
    totalUsers,
    totalStudents,
    totalMentors,
    totalCourses,
    totalEnrollments,
    paymentsAggregate,
    recentPayments,
    schoolsByStatus,
    enrollmentsByMonth,
  ] = await Promise.all([
    prisma.school.count(),
    prisma.user.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "MENTOR" } }),
    prisma.course.count(),
    prisma.enrollment.count(),
    // Revenue aggregation across all successful payments
    prisma.payment.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true, commission: true },
      _count: true,
    }),
    // Last 5 successful payments
    prisma.payment.findMany({
      where: { status: "SUCCESS" },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
    // Schools grouped by status
    prisma.school.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    // Enrollment count grouped by month (last 6 months)
    prisma.enrollment.findMany({
      select: { submittedAt: true },
      orderBy: { submittedAt: "desc" },
      take: 180,
    }),
  ]);

  const grossRevenue = Number(paymentsAggregate._sum.amount ?? 0);
  const totalCommission = Number(paymentsAggregate._sum.commission ?? 0);

  // Group enrollments by month
  const monthlyEnrollments = groupByMonth(
    enrollmentsByMonth.map((e) => ({ date: e.submittedAt, count: 1 })),
  );

  return {
    platform: {
      totalSchools,
      totalUsers,
      totalStudents,
      totalMentors,
      totalCourses,
      totalEnrollments,
    },
    revenue: {
      grossRevenue,
      platformCommission: totalCommission,
      netPayout: grossRevenue - totalCommission,
      totalTransactions: paymentsAggregate._count,
    },
    schoolsByStatus: Object.fromEntries(
      schoolsByStatus.map((s) => [s.status, s._count.id]),
    ),
    monthlyEnrollments,
    recentPayments,
  };
}

// ─── School Admin Dashboard ───────────────────────────────────────────────────

/**
 * GET /schools/:id/dashboard
 * School-level KPIs for ADMIN and EDUCATION_HEAD.
 */
export async function getSchoolDashboard(schoolId: string, actor: AuthUser) {
  // Admins can only see their own school
  if (
    (actor.role === Role.ADMIN || actor.role === Role.EDUCATION_HEAD) &&
    actor.schoolId !== schoolId
  ) {
    throw AppError.forbidden("You can only view your own school's dashboard");
  }

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw AppError.notFound("School not found");

  const [
    totalStudents,
    totalMentors,
    totalClassrooms,
    totalCourses,
    totalApplications,
    pendingApplications,
    acceptedApplications,
    revenueAggregate,
    topCourses,
    classroomSummaries,
    recentReviews,
  ] = await Promise.all([
    prisma.user.count({ where: { schoolId, role: "STUDENT" } }),
    prisma.user.count({ where: { schoolId, role: "MENTOR" } }),
    prisma.classroom.count({ where: { schoolId } }),
    prisma.course.count({ where: { schoolId } }),
    prisma.enrollment.count({ where: { schoolId } }),
    prisma.enrollment.count({ where: { schoolId, status: "PENDING" } }),
    prisma.enrollment.count({ where: { schoolId, status: "ACCEPTED" } }),
    prisma.payment.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true, commission: true },
    }),
    // Top 5 courses by enrollment
    prisma.classroomCourse.groupBy({
      by: ["courseId"],
      _count: { courseId: true },
      orderBy: { _count: { courseId: "desc" } },
      take: 5,
    }),
    // Classrooms with student counts
    prisma.classroom.findMany({
      where: { schoolId },
      include: {
        _count: { select: { students: true, mentors: true, tasks: true } },
      },
    }),
    prisma.review.findMany({
      where: { schoolId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    }),
  ]);

  const grossRevenue = Number(revenueAggregate._sum.amount ?? 0);
  const commission = Number(revenueAggregate._sum.commission ?? 0);

  return {
    school: {
      id: school.id,
      name: school.name,
      rating: school.rating,
      status: school.status,
    },
    kpis: {
      totalStudents,
      totalMentors,
      totalClassrooms,
      totalCourses,
      totalApplications,
      pendingApplications,
      acceptedApplications,
    },
    revenue: {
      grossRevenue,
      platformCommission: commission,
      netPayout: grossRevenue - commission,
    },
    topCourses,
    classrooms: classroomSummaries,
    recentReviews,
  };
}

// ─── Mentor Dashboard ─────────────────────────────────────────────────────────

/**
 * GET /mentor/:id/dashboard
 * Mentor-level view of their classrooms, tasks, and student submission stats.
 */
export async function getMentorDashboard(mentorId: string, actor: AuthUser) {
  if (actor.role === Role.MENTOR && actor.id !== mentorId) {
    throw AppError.forbidden("You can only view your own dashboard");
  }
  if (actor.role === Role.STUDENT) {
    throw AppError.forbidden("Students cannot view mentor dashboards");
  }

  const [classrooms, tasks, recentSubmissions] = await Promise.all([
    prisma.classroomMentor.findMany({
      where: { mentorId },
      include: {
        classroom: {
          include: {
            _count: { select: { students: true, tasks: true } },
          },
        },
      },
    }),
    prisma.task.findMany({
      where: {
        classroom: {
          mentors: { some: { mentorId } },
        },
      },
      orderBy: { deadline: "asc" },
      take: 10,
      include: {
        _count: { select: { submissions: true } },
      },
    }),
    prisma.submission.findMany({
      where: {
        task: {
          classroom: {
            mentors: { some: { mentorId } },
          },
        },
        grade: null,
      },
      take: 10,
      orderBy: { submittedAt: "desc" },
      include: {
        student: { select: { id: true, firstName: true, lastName: true } },
        task: { select: { id: true, title: true, type: true } },
      },
    }),
  ]);

  const classroomIds = classrooms.map((c) => c.classroomId);

  const [totalStudents, gradedCount, ungradedCount] = await Promise.all([
    prisma.enrollment.count({
      where: { classroomId: { in: classroomIds }, status: "ACCEPTED" },
    }),
    prisma.submission.count({
      where: {
        task: { classroomId: { in: classroomIds } },
        grade: { not: null },
      },
    }),
    prisma.submission.count({
      where: {
        task: { classroomId: { in: classroomIds } },
        grade: null,
      },
    }),
  ]);

  const mentorSummary = {
    totalClassrooms: classrooms.length,
    totalStudents,
    gradedSubmissions: gradedCount,
    ungradedSubmissions: ungradedCount,
  };

  return {
    summary: mentorSummary,
    classrooms,
    upcomingTasks: tasks,
    pendingGrading: recentSubmissions,
  };
}

// ─── Education Head Dashboard ─────────────────────────────────────────────────

/**
 * GET /education-head/:id/dashboard
 * Education Head view of academic progress, course coverage, and task completion.
 */
export async function getEducationHeadDashboard(userId: string, actor: AuthUser) {
  if (actor.role === Role.EDUCATION_HEAD && actor.id !== userId) {
    throw AppError.forbidden("You can only view your own dashboard");
  }
  if (actor.role === Role.STUDENT || actor.role === Role.MENTOR) {
    throw AppError.forbidden("Access denied");
  }

  const schoolId = actor.schoolId;
  if (!schoolId) throw AppError.badRequest("Education Head is not assigned to a school");

  const [
    totalCourses,
    totalTopics,
    classroomCourseCount,
    taskStats,
    submissionStats,
    passStatusGroups,
  ] = await Promise.all([
    prisma.course.count({ where: { schoolId } }),
    prisma.topic.count({ where: { course: { schoolId } } }),
    prisma.classroomCourse.count({
      where: { classroom: { schoolId } },
    }),
    prisma.task.groupBy({
      by: ["type"],
      where: { classroom: { schoolId } },
      _count: { id: true },
    }),
    prisma.submission.aggregate({
      where: {
        task: { classroom: { schoolId } },
      },
      _count: true,
      _avg: { grade: true },
    }),
    prisma.enrollment.groupBy({
      by: ["status"],
      where: { schoolId },
      _count: { _all: true },
    }),
  ]);

  return {
    academic: {
      totalCourses,
      totalTopics,
      coursesAssignedToClassrooms: classroomCourseCount,
    },
    tasks: Object.fromEntries(taskStats.map((t) => [t.type, t._count.id])),
    submissions: {
      total: submissionStats._count,
      averageGrade: submissionStats._avg.grade != null
        ? Number(submissionStats._avg.grade.toFixed(1))
        : null,
    },
    studentProgress: Object.fromEntries(
      passStatusGroups.map((g) => [g.status, g._count._all]),
    ),
  };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function groupByMonth(items: { date: Date; count: number }[]) {
  const result: Record<string, number> = {};
  for (const item of items) {
    const key = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, "0")}`;
    result[key] = (result[key] ?? 0) + item.count;
  }
  return Object.entries(result)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, count]) => ({ month, count }));
}
