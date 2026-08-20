import prisma from "../config/db.js";
import { AppError } from "../helpers/appError.js";
import { Role, type AuthUser } from "../types/auth.types.js";
import type { CreateStudentReportInput } from "../validators/reports.schema.js";

/**
 * File a student conduct report for a classroom (Mentor / Admin).
 */
export async function createStudentReport(
  classroomId: string,
  input: CreateStudentReportInput,
  actor: AuthUser,
) {
  if (actor.role === Role.STUDENT) {
    throw AppError.forbidden("Students cannot file student reports");
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
  });
  if (!classroom) throw AppError.notFound("Classroom not found");

  const student = await prisma.user.findUnique({
    where: { id: input.reportedStudentId },
  });
  if (!student) throw AppError.notFound("Reported student not found");

  return prisma.studentReport.create({
    data: {
      classroomId,
      reportedById: actor.id,
      reportedStudentId: input.reportedStudentId,
      note: input.note,
    },
    include: {
      reportedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
      reportedStudent: { select: { id: true, firstName: true, lastName: true, email: true } },
      classroom: { select: { id: true, name: true } },
    },
  });
}

/**
 * Get all reports filed in a classroom.
 */
export async function getClassroomReports(classroomId: string, actor: AuthUser) {
  if (actor.role === Role.STUDENT) {
    throw AppError.forbidden("Students cannot view classroom reports");
  }

  return prisma.studentReport.findMany({
    where: { classroomId },
    orderBy: { createdAt: "desc" },
    include: {
      reportedBy: { select: { id: true, firstName: true, lastName: true, role: true } },
      reportedStudent: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}
