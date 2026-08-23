import prisma from "../../shared/config/db.js";
import { AppError } from "../../shared/helpers/appError.js";
import { Role, type AuthUser } from "../../shared/types/auth.types.js";
import type { CreateResourceInput } from "./resources.schema.js";

const STAFF_ROLES = [Role.ADMIN, Role.EDUCATION_HEAD, Role.MENTOR, Role.SUPER_ADMIN];

async function assertStaffOfClassroom(classroomId: string, actor: AuthUser) {
  if (!STAFF_ROLES.includes(actor.role)) {
    throw AppError.forbidden("Only staff can manage classroom resources");
  }
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom) throw AppError.notFound("Classroom not found");
  if (actor.role !== Role.SUPER_ADMIN && actor.schoolId && actor.schoolId !== classroom.schoolId) {
    throw AppError.forbidden("You can only manage resources for your school");
  }
}

export async function getResources(classroomId: string) {
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom) throw AppError.notFound("Classroom not found");

  return prisma.resource.findMany({
    where: { classroomId },
    orderBy: [{ mandatory: "desc" }, { uploadedAt: "asc" }],
  });
}

export async function createResource(classroomId: string, input: CreateResourceInput, actor: AuthUser) {
  await assertStaffOfClassroom(classroomId, actor);

  return prisma.resource.create({
    data: {
      classroomId,
      topicId: input.topicId ?? null,
      title: input.title.trim(),
      type: input.type,
      url: input.url,
      mandatory: input.mandatory ?? false,
    },
  });
}
