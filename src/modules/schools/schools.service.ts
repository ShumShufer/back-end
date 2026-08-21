import prisma from "../../shared/config/db.js";
import { AppError } from "../../shared/helpers/appError.js";
import type {
  CreateSchoolInput,
  UpdateSchoolInput,
  UpdateSchoolStatusInput,
  QuerySchoolsInput,
} from "./school.schema.js";

/**
 * Get all schools with pagination, search, and status filtering
 */
export async function getAllSchools(query: QuerySchoolsInput) {
  const { page = 1, pageSize = 20, search, status } = query;
  const skip = (page - 1) * pageSize;

  const whereClause: Record<string, any> = {};

  if (status) {
    whereClause.status = status;
  }

  if (search) {
    whereClause.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  const [schools, total] = await Promise.all([
    prisma.school.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        branches: true,
        _count: {
          select: {
            classrooms: true,
            courses: true,
            users: true,
          },
        },
      },
    }),
    prisma.school.count({ where: whereClause }),
  ]);

  return {
    schools,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Get single school profile by ID with branches and course counts
 */
export async function getSchoolById(schoolId: string) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      branches: true,
      courses: {
        select: {
          id: true,
          title: true,
          price: true,
          isFree: true,
        },
      },
      _count: {
        select: {
          classrooms: true,
          users: true,
          reviews: true,
        },
      },
    },
  });

  if (!school) {
    throw AppError.notFound("School not found");
  }

  return school;
}

/**
 * Create a new school (SUPER_ADMIN)
 */
export async function createSchool(data: CreateSchoolInput) {
  const school = await prisma.school.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      status: "ACTIVE",
    },
  });

  return school;
}

/**
 * Update school profile (ADMIN, SUPER_ADMIN)
 */
export async function updateSchool(schoolId: string, data: UpdateSchoolInput) {
  const existingSchool = await prisma.school.findUnique({
    where: { id: schoolId },
  });

  if (!existingSchool) {
    throw AppError.notFound("School not found");
  }

  const updatedSchool = await prisma.school.update({
    where: { id: schoolId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description ?? null }),
    },
  });

  return updatedSchool;
}

/**
 * Update school status (SUPER_ADMIN)
 */
export async function updateSchoolStatus(
  schoolId: string,
  data: UpdateSchoolStatusInput,
) {
  const existingSchool = await prisma.school.findUnique({
    where: { id: schoolId },
  });

  if (!existingSchool) {
    throw AppError.notFound("School not found");
  }

  const updatedSchool = await prisma.school.update({
    where: { id: schoolId },
    data: {
      status: data.status,
    },
  });

  return updatedSchool;
}

/**
 * Get aggregated statistics for a school
 */
export async function getSchoolStats(schoolId: string) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
  });

  if (!school) {
    throw AppError.notFound("School not found");
  }

  const [studentCount, branchCount, classroomCount, courseCount] =
    await Promise.all([
      prisma.user.count({
        where: {
          schoolId,
          role: "STUDENT",
        },
      }),
      prisma.branch.count({
        where: { schoolId },
      }),
      prisma.classroom.count({
        where: { schoolId },
      }),
      prisma.course.count({
        where: { schoolId },
      }),
    ]);

  return {
    schoolId: school.id,
    schoolName: school.name,
    rating: school.rating,
    status: school.status,
    stats: {
      totalStudents: studentCount,
      totalBranches: branchCount,
      totalClassrooms: classroomCount,
      totalCourses: courseCount,
    },
  };
}
