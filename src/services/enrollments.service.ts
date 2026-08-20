import prisma from "../config/db.js";
import { AppError } from "../helpers/appError.js";
import { Role, type AuthUser } from "../types/auth.types.js";
import type {
  SubmitApplicationInput,
  AcceptApplicationInput,
  RejectApplicationInput,
  UpsertFormTemplateInput,
  QueryApplicationsInput,
} from "../validators/enrollments.schema.js";

/**
 * Get the application form template for a school.
 * Returns null (not a 404) if no template has been configured yet,
 * so the frontend can show a "no form configured" state gracefully.
 */
export async function getFormTemplate(schoolId: string) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) {
    throw AppError.notFound("School not found");
  }

  const template = await prisma.applicationFormTemplate.findFirst({
    where: { schoolId },
  });

  return template;
}

/**
 * Create or replace the application form template for a school (ADMIN).
 * We upsert rather than create so calling this a second time updates in place.
 */
export async function upsertFormTemplate(
  schoolId: string,
  data: UpsertFormTemplateInput,
) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) {
    throw AppError.notFound("School not found");
  }

  const existing = await prisma.applicationFormTemplate.findFirst({
    where: { schoolId },
  });

  if (existing) {
    return prisma.applicationFormTemplate.update({
      where: { id: existing.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Cast required: Zod infers unknown[] but Prisma expects its own runtime.InputJsonValue type
      data: { fields: data.fields as any },
    });
  }

  return prisma.applicationFormTemplate.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Cast required: same JSON type boundary between Zod schema output and Prisma's InputJsonValue
    data: { schoolId, fields: data.fields as any },
  });
}

/**
 * Get all enrollment applications for a school (Admin inbox).
 * Supports filtering by status and pagination.
 */
export async function getApplicationsBySchool(
  schoolId: string,
  query: QueryApplicationsInput,
) {
  const { status, page, pageSize } = query;
  const skip = (page - 1) * pageSize;

  const whereClause: Record<string, unknown> = { schoolId };
  if (status) {
    whereClause.status = status;
  }

  const [applications, total] = await Promise.all([
    prisma.enrollment.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { submittedAt: "desc" },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        classroom: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.enrollment.count({ where: whereClause }),
  ]);

  return {
    applications,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Get all applications submitted by the currently authenticated student.
 */
export async function getMyApplications(studentId: string) {
  return prisma.enrollment.findMany({
    where: { studentId },
    orderBy: { submittedAt: "desc" },
    include: {
      school: {
        select: { id: true, name: true },
      },
      classroom: {
        select: { id: true, name: true },
      },
    },
  });
}

/**
 * Get all applications for a specific student by their user ID.
 * Students can only view themselves. School admins receive only applications
 * submitted to their school; SUPER_ADMIN can view all of a student's records.
 */
export async function getApplicationsByStudentId(
  studentId: string,
  requester: AuthUser,
) {
  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student) {
    throw AppError.notFound("Student not found");
  }

  if (requester.role === Role.STUDENT && requester.id !== studentId) {
    throw AppError.forbidden("You can only view your own applications");
  }

  if (requester.role !== Role.SUPER_ADMIN && requester.role !== Role.STUDENT) {
    if (!requester.schoolId) {
      throw AppError.forbidden("School context is required for this action");
    }
  }

  return prisma.enrollment.findMany({
    where: {
      studentId,
      ...(requester.role !== Role.SUPER_ADMIN && requester.role !== Role.STUDENT
        ? { schoolId: requester.schoolId! }
        : {}),
    },
    orderBy: { submittedAt: "desc" },
    include: {
      school: {
        select: { id: true, name: true },
      },
      classroom: {
        select: { id: true, name: true },
      },
    },
  });
}

/**
 * Submit a new enrollment application to a school (STUDENT).
 * Prevents duplicate PENDING applications to the same school.
 */
export async function submitApplication(
  studentId: string,
  schoolId: string,
  data: SubmitApplicationInput,
) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) {
    throw AppError.notFound("School not found");
  }

  // Prevent a student from spamming applications to the same school
  const existingPending = await prisma.enrollment.findFirst({
    where: {
      studentId,
      schoolId,
      status: "PENDING",
    },
  });

  if (existingPending) {
    throw AppError.conflict(
      "You already have a pending application for this school",
    );
  }

  const enrollment = await prisma.enrollment.create({
    data: {
      studentId,
      schoolId,
      mode: data.mode,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // Cast required: Zod's Record<string, unknown> doesn't satisfy Prisma's runtime.InputJsonValue
      formResponses: data.formResponses as any,
      status: "PENDING",
    },
  });

  return enrollment;
}

/**
 * Accept an enrollment application (ADMIN).
 *
 * This is a critical multi-step atomic operation — all steps run inside a
 * single Prisma transaction so partial failures don't leave corrupted state:
 *   1. Mark the enrollment as ACCEPTED and set reviewedAt/reviewedById
 *   2. Assign the student to the specified classroom
 *   3. Update the student's schoolId on their User record (so scopeToSchool works going forward)
 *   4. Fire a notification to the student
 */
export async function acceptApplication(
  enrollmentId: string,
  reviewerId: string,
  data: AcceptApplicationInput,
) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { student: true },
  });

  if (!enrollment) {
    throw AppError.notFound("Application not found");
  }

  if (enrollment.status !== "PENDING") {
    throw AppError.badRequest(
      `Cannot accept an application with status "${enrollment.status}"`,
    );
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: data.classroomId },
  });

  if (!classroom) {
    throw AppError.notFound("Classroom not found");
  }

  // Classroom must belong to the same school as the application
  if (classroom.schoolId !== enrollment.schoolId) {
    throw AppError.badRequest(
      "Classroom does not belong to the school this application is for",
    );
  }

  // Wrap all DB mutations in a transaction — if any step fails, all are rolled back
  const result = await prisma.$transaction(async (tx) => {
    // Step 1: Accept the enrollment and record who reviewed it
    const updatedEnrollment = await tx.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: "ACCEPTED",
        classroomId: data.classroomId,
        reviewedAt: new Date(),
        reviewedById: reviewerId,
      },
    });

    // Step 2: Bind the student's User record to this school so scopeToSchool
    // checks pass correctly for all future requests from this student
    await tx.user.update({
      where: { id: enrollment.studentId },
      data: { schoolId: enrollment.schoolId },
    });

    // Step 3: Create a notification record and fan it out to the student
    const notification = await tx.notification.create({
      data: {
        topic: "APPLICATION",
        title: "Application Accepted",
        body: `Your application to join the school has been accepted. You have been assigned to classroom: ${classroom.name}.`,
        relatedEntityId: enrollmentId,
        recipients: {
          create: {
            userId: enrollment.studentId,
          },
        },
      },
    });

    return { enrollment: updatedEnrollment, notification };
  });

  return result.enrollment;
}

/**
 * Reject an enrollment application (ADMIN).
 * Sends a notification to the student with the optional rejection reason.
 */
export async function rejectApplication(
  enrollmentId: string,
  reviewerId: string,
  data: RejectApplicationInput,
) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
  });

  if (!enrollment) {
    throw AppError.notFound("Application not found");
  }

  if (enrollment.status !== "PENDING") {
    throw AppError.badRequest(
      `Cannot reject an application with status "${enrollment.status}"`,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedEnrollment = await tx.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedById: reviewerId,
      },
    });

    const notificationBody = data.reason
      ? `Your application has been rejected. Reason: ${data.reason}`
      : "Your application has been reviewed and unfortunately was not accepted at this time.";

    await tx.notification.create({
      data: {
        topic: "APPLICATION",
        title: "Application Update",
        body: notificationBody,
        relatedEntityId: enrollmentId,
        recipients: {
          create: {
            userId: enrollment.studentId,
          },
        },
      },
    });

    return updatedEnrollment;
  });

  return result;
}

/**
 * Allow a student to withdraw their own PENDING application.
 * Students can only withdraw their own applications — ownership is verified here.
 */
export async function withdrawApplication(
  enrollmentId: string,
  studentId: string,
) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
  });

  if (!enrollment) {
    throw AppError.notFound("Application not found");
  }

  // Ownership check: a student can only withdraw their own application
  if (enrollment.studentId !== studentId) {
    throw AppError.forbidden("You can only withdraw your own applications");
  }

  if (enrollment.status !== "PENDING") {
    throw AppError.badRequest(
      `Cannot withdraw an application with status "${enrollment.status}"`,
    );
  }

  return prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { status: "WITHDRAWN" },
  });
}
