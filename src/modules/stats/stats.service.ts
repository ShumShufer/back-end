import prisma from "../../shared/config/db.js";

/**
 * Public, honest platform statistics for the landing page hero.
 */
export async function getPlatformStats() {
  const [totalActiveSchools, enrollments, ratings] = await Promise.all([
    prisma.school.count({ where: { status: "ACTIVE" } }),
    prisma.enrollment.findMany({
      where: { status: "ACCEPTED" },
      select: { studentId: true },
      distinct: ["studentId"],
    }),
    prisma.school.aggregate({
      where: { status: "ACTIVE", rating: { gt: 0 } },
      _avg: { rating: true },
    }),
  ]);

  const avg = ratings._avg.rating;

  return {
    totalActiveSchools,
    totalStudentsEnrolled: enrollments.length,
    avgSchoolRating: avg ? Number(avg.toFixed(1)) : null,
  };
}
