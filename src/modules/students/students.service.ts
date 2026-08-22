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
