import prisma from "../config/db.js";
import { AppError } from "../helpers/appError.js";
import type {
  CreateStaffPostInput,
  UpdateStaffPostInput,
  QueryStaffPostsInput,
  SubmitStaffApplicationInput,
  QueryStaffApplicationsInput,
} from "../validators/staffApplications.schema.js";

/**
 * Get all open staff posts across all schools (public browsing).
 * Supports filtering by role and status with pagination.
 */
export async function getStaffPosts(query: QueryStaffPostsInput) {
  const { role, status, page, pageSize } = query;
  const skip = (page - 1) * pageSize;

  const whereClause: Record<string, unknown> = {};
  if (role) whereClause.role = role;
  // Default to OPEN posts only when no status filter is provided,
  // so public browsing never shows closed listings by accident
  whereClause.status = status ?? "OPEN";

  const [posts, total] = await Promise.all([
    prisma.staffApplicationPost.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        school: {
          select: { id: true, name: true },
        },
        _count: {
          select: { applications: true },
        },
      },
    }),
    prisma.staffApplicationPost.count({ where: whereClause }),
  ]);

  return {
    posts,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Get all staff posts for a specific school (ADMIN managing their own posts).
 */
export async function getStaffPostsBySchool(
  schoolId: string,
  query: QueryStaffPostsInput,
) {
  const { role, status, page, pageSize } = query;
  const skip = (page - 1) * pageSize;

  const whereClause: Record<string, unknown> = { schoolId };
  if (role) whereClause.role = role;
  if (status) whereClause.status = status;

  const [posts, total] = await Promise.all([
    prisma.staffApplicationPost.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    }),
    prisma.staffApplicationPost.count({ where: whereClause }),
  ]);

  return {
    posts,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Get a single staff post by ID.
 */
export async function getStaffPostById(postId: string) {
  const post = await prisma.staffApplicationPost.findUnique({
    where: { id: postId },
    include: {
      school: {
        select: { id: true, name: true },
      },
      _count: {
        select: { applications: true },
      },
    },
  });

  if (!post) {
    throw AppError.notFound("Staff post not found");
  }

  return post;
}

/**
 * Create a new staff job post for a school (ADMIN).
 */
export async function createStaffPost(
  schoolId: string,
  data: CreateStaffPostInput,
) {
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) {
    throw AppError.notFound("School not found");
  }

  return prisma.staffApplicationPost.create({
    data: {
      schoolId,
      role: data.role,
      description: data.description,
      status: "OPEN",
    },
  });
}

/**
 * Update a staff post's description or open/close status (ADMIN).
 */
export async function updateStaffPost(
  postId: string,
  data: UpdateStaffPostInput,
) {
  const post = await prisma.staffApplicationPost.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw AppError.notFound("Staff post not found");
  }

  return prisma.staffApplicationPost.update({
    where: { id: postId },
    data: {
      ...(data.description && { description: data.description }),
      ...(data.status && { status: data.status }),
    },
  });
}

/**
 * Get all applications submitted to a specific school's staff posts (ADMIN inbox).
 */
export async function getStaffApplicationsBySchool(
  schoolId: string,
  query: QueryStaffApplicationsInput,
) {
  const { status, page, pageSize } = query;
  const skip = (page - 1) * pageSize;

  // Filter through the post relation to scope applications to this school
  const whereClause: Record<string, unknown> = {
    post: { schoolId },
  };
  if (status) whereClause.status = status;

  const [applications, total] = await Promise.all([
    prisma.staffApplication.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { submittedAt: "desc" },
      include: {
        post: {
          select: { id: true, role: true, description: true },
        },
      },
    }),
    prisma.staffApplication.count({ where: whereClause }),
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
 * Submit an application to a staff post (any authenticated user).
 * Prevents duplicate applications to the same post.
 */
export async function submitStaffApplication(
  applicantId: string,
  postId: string,
  data: SubmitStaffApplicationInput,
) {
  const post = await prisma.staffApplicationPost.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw AppError.notFound("Staff post not found");
  }

  // Closed posts no longer accept new applications
  if (post.status === "CLOSED") {
    throw AppError.badRequest("This staff position is no longer accepting applications");
  }

  const existing = await prisma.staffApplication.findFirst({
    where: { postId, applicantId },
  });

  if (existing) {
    throw AppError.conflict("You have already applied to this staff position");
  }

  return prisma.staffApplication.create({
    data: {
      postId,
      applicantId,
      resumeUrl: data.resumeUrl ?? null,
      status: "PENDING",
    },
  });
}

/**
 * Accept a staff application (ADMIN).
 *
 * Atomic transaction — all steps succeed or all are rolled back:
 *   1. Mark the application as ACCEPTED
 *   2. Promote the applicant's role to the position they applied for
 *   3. Assign the applicant's schoolId to the school that posted the job
 *   4. Close the post so no new applications come in (one hire per post)
 *   5. Notify the applicant
 */
export async function acceptStaffApplication(
  applicationId: string,
  _reviewerId: string, // reserved for future audit logging
) {
  const application = await prisma.staffApplication.findUnique({
    where: { id: applicationId },
    include: {
      post: {
        include: {
          school: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!application) {
    throw AppError.notFound("Staff application not found");
  }

  if (application.status !== "PENDING") {
    throw AppError.badRequest(
      `Cannot accept an application with status "${application.status}"`,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // Step 1: Accept the application
    const updatedApplication = await tx.staffApplication.update({
      where: { id: applicationId },
      data: { status: "ACCEPTED" },
    });

    // Step 2 & 3: Promote the applicant — update their role AND bind them to
    // the hiring school so scopeToSchool checks work immediately after login
    await tx.user.update({
      where: { id: application.applicantId },
      data: {
        role: application.post.role,
        schoolId: application.post.schoolId,
      },
    });

    // Step 4: Close the post — a position is filled once someone is accepted
    await tx.staffApplicationPost.update({
      where: { id: application.postId },
      data: { status: "CLOSED" },
    });

    // Step 5: Notify the successful applicant
    await tx.notification.create({
      data: {
        topic: "STAFF_POST",
        title: "Staff Application Accepted",
        body: `Congratulations! Your application for the ${application.post.role} position at ${application.post.school.name} has been accepted.`,
        relatedEntityId: applicationId,
        recipients: {
          create: { userId: application.applicantId },
        },
      },
    });

    return updatedApplication;
  });

  return result;
}

/**
 * Reject a staff application (ADMIN).
 * Sends a notification to the applicant.
 */
export async function rejectStaffApplication(
  applicationId: string,
  _reviewerId: string, // reserved for future audit logging
) {
  const application = await prisma.staffApplication.findUnique({
    where: { id: applicationId },
    include: {
      post: {
        include: {
          school: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!application) {
    throw AppError.notFound("Staff application not found");
  }

  if (application.status !== "PENDING") {
    throw AppError.badRequest(
      `Cannot reject an application with status "${application.status}"`,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedApplication = await tx.staffApplication.update({
      where: { id: applicationId },
      data: { status: "REJECTED" },
    });

    await tx.notification.create({
      data: {
        topic: "STAFF_POST",
        title: "Staff Application Update",
        body: `Thank you for applying for the ${application.post.role} position at ${application.post.school.name}. Unfortunately, your application was not successful at this time.`,
        relatedEntityId: applicationId,
        recipients: {
          create: { userId: application.applicantId },
        },
      },
    });

    return updatedApplication;
  });

  return result;
}
