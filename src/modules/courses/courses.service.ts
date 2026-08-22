import prisma from "../../shared/config/db.js";
import { AppError } from "../../shared/helpers/appError.js";
import { Role, type AuthUser } from "../../shared/types/auth.types.js";
import type {
  CreateCourseInput,
  UpdateCourseInput,
  QueryCoursesInput,
} from "./courses.schema.js";

/**
 * List all courses with optional filtering by school and search term.
 * Students can browse free courses without authentication.
 * Premium topic content is access-controlled separately at the topic level.
 */
export async function getCourses(query: QueryCoursesInput) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (query.schoolId) where.schoolId = query.schoolId;
  if (query.search) {
    where.title = { contains: query.search, mode: "insensitive" };
  }

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        school: { select: { id: true, name: true } },
        _count: { select: { topics: true } },
      },
    }),
    prisma.course.count({ where }),
  ]);

  return {
    courses,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

/**
 * Get a single course by ID, including its ordered topic list.
 * Topic content (videoUrl, content) is stripped for non-enrolled students
 * unless the course is free.
 */
export async function getCourseById(courseId: string, requestingUser?: AuthUser) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      school: { select: { id: true, name: true } },
      topics: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          order: true,
          // Only include content fields — we'll strip them below if needed
          videoUrl: true,
          content: true,
        },
      },
      _count: { select: { topics: true } },
    },
  });

  if (!course) throw AppError.notFound("Course not found");

  // If the course is free, return full content to everyone
  if (course.isFree) return course;

  // If no user, strip content fields from all topics
  if (!requestingUser) {
    return {
      ...course,
      topics: course.topics.map((t) => ({ id: t.id, title: t.title, order: t.order })),
    };
  }

  // Admins, Super Admins, Education Heads, and Mentors always see full content
  const staffRoles: string[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.EDUCATION_HEAD, Role.MENTOR];
  if (staffRoles.includes(requestingUser.role)) return course;

  // For students, check if they are enrolled in a classroom that has this course
  if (requestingUser.role === Role.STUDENT) {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: requestingUser.id,
        status: "ACCEPTED",
        classroom: {
          courses: { some: { courseId } },
        },
      },
    });

    if (enrollment) return course;

    // Student is not enrolled — strip premium content
    return {
      ...course,
      topics: course.topics.map((t) => ({ id: t.id, title: t.title, order: t.order })),
    };
  }

  return course;
}

/**
 * Create a new course.
 * Only ADMIN, EDUCATION_HEAD, or SUPER_ADMIN can create courses.
 * An ADMIN's course is automatically scoped to their school.
 */
export async function createCourse(input: CreateCourseInput, actor: AuthUser) {
  // For an ADMIN, scope the course to their school automatically
  let schoolId = input.schoolId;
  if (actor.role === Role.ADMIN) {
    if (!actor.schoolId) throw AppError.forbidden("Admin is not assigned to a school");
    schoolId = actor.schoolId;
  }

  // A free course should have a price of 0
  if (input.isFree && input.price > 0) {
    throw AppError.badRequest("A free course must have a price of 0");
  }

  const course = await prisma.course.create({
    data: {
      schoolId: schoolId ?? null,
      title: input.title,
      description: input.description ?? null,
      price: input.price,
      isFree: input.isFree,
    },
    include: {
      school: { select: { id: true, name: true } },
      _count: { select: { topics: true } },
    },
  });

  return course;
}

/**
 * Update a course's metadata.
 */
export async function updateCourse(
  courseId: string,
  input: UpdateCourseInput,
  actor: AuthUser,
) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw AppError.notFound("Course not found");

  // An ADMIN can only update courses belonging to their own school
  if (actor.role === Role.ADMIN && course.schoolId !== actor.schoolId) {
    throw AppError.forbidden("You can only update courses belonging to your school");
  }

  // If toggling to free, ensure price is 0
  const isFree = input.isFree ?? course.isFree;
  const price = input.price ?? Number(course.price);
  if (isFree && price > 0) {
    throw AppError.badRequest("A free course must have a price of 0");
  }

  return prisma.course.update({
    where: { id: courseId },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.isFree !== undefined && { isFree: input.isFree }),
    },
    include: { school: { select: { id: true, name: true } } },
  });
}

/**
 * AI Price Recommendation
 *
 * Calculates a suggested price for a course by analyzing the pricing
 * distribution of existing courses in the same school (or platform-wide
 * if no schoolId is given). Returns a recommended price, the market average,
 * and a confidence band (± one standard deviation).
 */
export async function getPriceRecommendation(courseId: string) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw AppError.notFound("Course not found");

  // Fetch all non-free course prices in the same scope (school or global)
  const comparableCourses = await prisma.course.findMany({
    where: {
      isFree: false,
      id: { not: courseId },
      ...(course.schoolId ? { schoolId: course.schoolId } : {}),
    },
    select: { price: true },
  });

  if (comparableCourses.length === 0) {
    return {
      recommendedPrice: Number(course.price) || 500,
      marketAverage: null,
      lowerBound: null,
      upperBound: null,
      confidence: "low",
      note: "Not enough market data. Recommendation is based on a platform default.",
    };
  }

  const prices = comparableCourses.map((c) => Number(c.price));
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;

  // Standard deviation
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);

  // Recommended price: mean + 5% premium to position the course competitively
  const recommendedPrice = Math.round(mean * 1.05);

  return {
    recommendedPrice,
    marketAverage: Math.round(mean),
    lowerBound: Math.round(Math.max(0, mean - stdDev)),
    upperBound: Math.round(mean + stdDev),
    confidence: comparableCourses.length >= 5 ? "high" : "medium",
    sampleSize: comparableCourses.length,
    note: "Price is recommended based on the average of comparable courses in the same school, with a 5% competitive premium.",
  };
}

/**
 * Publish final course result for a student in a classroom.
 */
export async function publishCourseResult(
  courseId: string,
  classroomId: string,
  studentId: string,
  finalExamScore?: number,
) {
  const isPassed = (finalExamScore ?? 0) >= 50;
  const status = isPassed ? "PASSED" : "FAILED";

  const existing = await prisma.courseResult.findFirst({
    where: { studentId, courseId, classroomId },
  });

  if (existing) {
    return prisma.courseResult.update({
      where: { id: existing.id },
      data: {
        status,
        ...(finalExamScore !== undefined && { finalExamScore }),
        publishedAt: new Date(),
      },
    });
  }

  return prisma.courseResult.create({
    data: {
      studentId,
      courseId,
      classroomId,
      status,
      finalExamScore: finalExamScore ?? null,
      publishedAt: new Date(),
    },
  });
}

/**
 * Get aggregated progress metrics for a student across all enrolled classrooms.
 */
export async function getStudentProgress(studentId: string, actor: AuthUser) {
  if (actor.role === Role.STUDENT && actor.id !== studentId) {
    throw AppError.forbidden("You can only view your own progress");
  }

  const [enrollments, submissions, courseResults] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId, status: "ACCEPTED" },
      include: {
        classroom: {
          include: {
            courses: { include: { course: true } },
            tasks: true,
          },
        },
      },
    }),
    prisma.submission.findMany({
      where: { studentId },
    }),
    prisma.courseResult.findMany({
      where: { studentId },
    }),
  ]);

  const classroomProgress = enrollments.map((e) => {
    const totalTasks = e.classroom?.tasks.length ?? 0;
    const completedSubmissions = submissions.filter(
      (s) => e.classroom?.tasks.some((t) => t.id === s.taskId),
    );
    const gradedSubmissions = completedSubmissions.filter((s) => s.grade !== null);
    const avgGrade =
      gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + (s.grade ?? 0), 0) / gradedSubmissions.length
        : null;

    const completionRate = totalTasks > 0 ? Math.round((completedSubmissions.length / totalTasks) * 100) : 0;

    return {
      classroomId: e.classroomId,
      classroomName: e.classroom?.name,
      courses: e.classroom?.courses.map((c) => c.course),
      totalTasks,
      completedTasks: completedSubmissions.length,
      averageGrade: avgGrade ? Math.round(avgGrade) : null,
      completionRate,
    };
  });

  return {
    studentId,
    enrolledClassroomsCount: enrollments.length,
    classrooms: classroomProgress,
    courseResults,
  };
}

/**
 * Get personalized course recommendations for a student.
 * Recommends courses from the student's school or top platform courses
 * that the student is not yet enrolled in.
 */
export async function getRecommendedCourses(actor: AuthUser) {
  // Find all course IDs the student is already enrolled in
  const enrolledCourses = await prisma.classroomCourse.findMany({
    where: {
      classroom: {
        students: {
          some: { studentId: actor.id, status: "ACCEPTED" },
        },
      },
    },
    select: { courseId: true },
  });

  const enrolledCourseIds = enrolledCourses.map((ec) => ec.courseId);

  // Recommend courses from student's school first (if available), then general courses
  const recommended = await prisma.course.findMany({
    where: {
      id: { notIn: enrolledCourseIds },
      ...(actor.schoolId ? { OR: [{ schoolId: actor.schoolId }, { schoolId: null }] } : {}),
    },
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      school: { select: { id: true, name: true } },
      _count: { select: { topics: true } },
    },
  });

  return recommended;
}

/**
 * Courses linked to a classroom, ordered by ClassroomCourse.order.
 */
export async function getClassroomCourses(classroomId: string) {
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  if (!classroom) throw AppError.notFound("Classroom not found");

  const links = await prisma.classroomCourse.findMany({
    where: { classroomId },
    orderBy: { order: "asc" },
    include: {
      course: {
        include: {
          _count: { select: { topics: true } },
        },
      },
    },
  });

  return links.map((link) => ({
    course: link.course,
    order: link.order,
    mandatory: link.mandatory,
  }));
}
