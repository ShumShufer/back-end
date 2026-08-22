import prisma from "../../shared/config/db.js";
import { AppError } from "../../shared/helpers/appError.js";
import { Role } from "../../shared/types/auth.types.js";
import type { AuthUser } from "../../shared/types/auth.types.js";
import type {
  CreateClassroomInput,
  UpdateClassroomInput,
} from "./classroom.schema.js";

/**
 * Get classrooms filtered by user role and school context
 */
export async function getClassrooms(
  user: AuthUser,
  filters?: { schoolId?: string },
) {
  const whereClause: Record<string, any> = {};

  if (user.role === Role.SUPER_ADMIN) {
    if (filters?.schoolId) {
      whereClause.schoolId = filters.schoolId;
    }
  } else if (user.role === Role.ADMIN || user.role === Role.EDUCATION_HEAD) {
    if (!user.schoolId) {
      throw AppError.forbidden("User is not associated with any school");
    }
    whereClause.schoolId = user.schoolId;
  } else if (user.role === Role.MENTOR) {
    whereClause.mentors = {
      some: {
        mentorId: user.id,
      },
    };
  } else if (user.role === Role.STUDENT) {
    whereClause.students = {
      some: {
        studentId: user.id,
      },
    };
  }

  const classrooms = await prisma.classroom.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      school: {
        select: {
          id: true,
          name: true,
        },
      },
      mentors: {
        include: {
          mentor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
      _count: {
        select: {
          students: true,
          courses: true,
          tasks: true,
        },
      },
    },
  });

  return classrooms;
}

/**
 * Get single classroom detail by ID
 */
export async function getClassroomById(classroomId: string) {
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
      mentors: {
        include: {
          mentor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
      courses: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              price: true,
              isFree: true,
            },
          },
        },
        orderBy: { order: "asc" },
      },
      _count: {
        select: {
          students: true,
          tasks: true,
          announcements: true,
          resources: true,
        },
      },
    },
  });

  if (!classroom) {
    throw AppError.notFound("Classroom not found");
  }

  return classroom;
}

/**
 * Create a new classroom (ADMIN, EDUCATION_HEAD)
 */
export async function createClassroom(
  schoolId: string,
  data: CreateClassroomInput,
) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
  });

  if (!school) {
    throw AppError.notFound("School not found");
  }

  const classroom = await prisma.classroom.create({
    data: {
      name: data.name,
      schoolId,
    },
  });

  return classroom;
}

/**
 * Update an existing classroom (ADMIN, EDUCATION_HEAD)
 */
export async function updateClassroom(
  classroomId: string,
  data: UpdateClassroomInput,
) {
  const existingClassroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
  });

  if (!existingClassroom) {
    throw AppError.notFound("Classroom not found");
  }

  const updatedClassroom = await prisma.classroom.update({
    where: { id: classroomId },
    data: {
      name: data.name,
    },
  });

  return updatedClassroom;
}

/**
 * Assign a mentor to a classroom (EDUCATION_HEAD, ADMIN)
 */
export async function assignMentor(classroomId: string, mentorId: string) {
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
  });

  if (!classroom) {
    throw AppError.notFound("Classroom not found");
  }

  const mentorUser = await prisma.user.findUnique({
    where: { id: mentorId },
  });

  if (!mentorUser) {
    throw AppError.notFound("Mentor user not found");
  }

  if (mentorUser.role !== Role.MENTOR) {
    throw AppError.badRequest("Selected user does not have the MENTOR role");
  }

  const existingAssignment = await prisma.classroomMentor.findUnique({
    where: {
      classroomId_mentorId: {
        classroomId,
        mentorId,
      },
    },
  });

  if (existingAssignment) {
    throw AppError.conflict("Mentor is already assigned to this classroom");
  }

  const assignment = await prisma.classroomMentor.create({
    data: {
      classroomId,
      mentorId,
    },
    include: {
      mentor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return assignment;
}

/**
 * Remove a mentor from a classroom (EDUCATION_HEAD, ADMIN)
 */
export async function removeMentor(classroomId: string, mentorId: string) {
  const existingAssignment = await prisma.classroomMentor.findUnique({
    where: {
      classroomId_mentorId: {
        classroomId,
        mentorId,
      },
    },
  });

  if (!existingAssignment) {
    throw AppError.notFound("Mentor assignment not found for this classroom");
  }

  await prisma.classroomMentor.delete({
    where: {
      classroomId_mentorId: {
        classroomId,
        mentorId,
      },
    },
  });

  return { message: "Mentor removed from classroom successfully" };
}

/**
 * Students accepted into a classroom (via ACCEPTED enrollments).
 */
export async function getClassroomStudents(classroomId: string) {
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom) throw AppError.notFound("Classroom not found");

  const enrollments = await prisma.enrollment.findMany({
    where: { classroomId, status: "ACCEPTED" },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
    },
    orderBy: { submittedAt: "asc" },
  });

  return enrollments.map((e) => e.student);
}
