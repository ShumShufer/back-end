import prisma from "../../shared/config/db.js";
import { AppError } from "../../shared/helpers/appError.js";
import { Role, type AuthUser } from "../../shared/types/auth.types.js";
import type {
  CreateAgreementInput,
  UpdateAgreementStatusInput,
  CreatePracticeRequestInput,
  UpdatePracticeRequestStatusInput,
} from "./agreements.schema.js";

/**
 * Propose an agreement between two schools with revenue/fee split.
 */
export async function createSchoolAgreement(input: CreateAgreementInput, actor: AuthUser) {
  if (actor.role !== Role.ADMIN && actor.role !== Role.SUPER_ADMIN) {
    throw AppError.forbidden("Only School Admins can propose school agreements");
  }

  const schoolAId = actor.schoolId;
  if (!schoolAId && actor.role !== Role.SUPER_ADMIN) {
    throw AppError.badRequest("Admin must be assigned to a school");
  }

  if (schoolAId === input.partnerSchoolId) {
    throw AppError.badRequest("Cannot form an agreement with your own school");
  }

  const partnerSchool = await prisma.school.findUnique({
    where: { id: input.partnerSchoolId },
  });
  if (!partnerSchool) throw AppError.notFound("Partner school not found");

  return prisma.schoolAgreement.create({
    data: {
      schoolAId: schoolAId!,
      schoolBId: input.partnerSchoolId,
      status: "PENDING",
      feeSplit: input.feeSplit,
    },
    include: {
      schoolA: { select: { id: true, name: true } },
      schoolB: { select: { id: true, name: true } },
    },
  });
}

/**
 * Get all agreements for the actor's school.
 */
export async function getSchoolAgreements(actor: AuthUser) {
  const where: Record<string, unknown> = {};

  if (actor.role === Role.ADMIN) {
    where.OR = [
      { schoolAId: actor.schoolId },
      { schoolBId: actor.schoolId },
    ];
  }

  return prisma.schoolAgreement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      schoolA: { select: { id: true, name: true } },
      schoolB: { select: { id: true, name: true } },
    },
  });
}

/**
 * Accept or reject a school agreement proposal.
 */
export async function updateAgreementStatus(
  agreementId: string,
  input: UpdateAgreementStatusInput,
  actor: AuthUser,
) {
  const agreement = await prisma.schoolAgreement.findUnique({
    where: { id: agreementId },
  });

  if (!agreement) throw AppError.notFound("Agreement not found");

  // Only the receiving partner school (schoolB) or SUPER_ADMIN can accept/reject
  if (actor.role === Role.ADMIN && agreement.schoolBId !== actor.schoolId) {
    throw AppError.forbidden("Only the recipient partner school can accept or reject this agreement");
  }

  return prisma.schoolAgreement.update({
    where: { id: agreementId },
    data: { status: input.status },
    include: {
      schoolA: { select: { id: true, name: true } },
      schoolB: { select: { id: true, name: true } },
    },
  });
}

/**
 * Create a Practice-Elsewhere request by a student.
 */
export async function createPracticeRequest(input: CreatePracticeRequestInput, actor: AuthUser) {
  if (actor.role !== Role.STUDENT) {
    throw AppError.forbidden("Only students can submit practice-elsewhere requests");
  }

  // Check that an active agreement exists between the home and host schools
  const agreement = await prisma.schoolAgreement.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { schoolAId: input.homeSchoolId, schoolBId: input.hostSchoolId },
        { schoolAId: input.hostSchoolId, schoolBId: input.homeSchoolId },
      ],
    },
  });

  if (!agreement) {
    throw AppError.badRequest(
      "No active partnership agreement exists between your home school and the requested host school",
    );
  }

  return prisma.practiceElsewhereRequest.create({
    data: {
      studentId: actor.id,
      homeSchoolId: input.homeSchoolId,
      hostSchoolId: input.hostSchoolId,
      fee: input.fee,
      status: "PENDING",
    },
  });
}

/**
 * Get practice-elsewhere requests.
 */
export async function getPracticeRequests(actor: AuthUser) {
  const where: Record<string, unknown> = {};

  if (actor.role === Role.STUDENT) {
    where.studentId = actor.id;
  } else if (actor.role === Role.ADMIN) {
    where.OR = [
      { homeSchoolId: actor.schoolId },
      { hostSchoolId: actor.schoolId },
    ];
  }

  return prisma.practiceElsewhereRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Accept or reject practice request.
 */
export async function updatePracticeRequestStatus(
  requestId: string,
  input: UpdatePracticeRequestStatusInput,
  actor: AuthUser,
) {
  const request = await prisma.practiceElsewhereRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) throw AppError.notFound("Practice request not found");

  if (actor.role === Role.ADMIN && request.hostSchoolId !== actor.schoolId && request.homeSchoolId !== actor.schoolId) {
    throw AppError.forbidden("You can only manage requests for your school");
  }

  return prisma.practiceElsewhereRequest.update({
    where: { id: requestId },
    data: { status: input.status },
  });
}
