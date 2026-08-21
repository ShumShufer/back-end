import prisma from "../../shared/config/db.js";
import { AppError } from "../../shared/helpers/appError.js";
import { Role, type AuthUser } from "../../shared/types/auth.types.js";
import type {
  CreateTopicInput,
  UpdateTopicInput,
} from "../courses/courses.schema.js";

/**
 * Get all topics for a course, ordered by their `order` field.
 * Content (videoUrl, content) is only returned if the requester is enrolled
 * in a classroom that uses this course, or if the course is free.
 */
export async function getTopicsByCourseId(courseId: string, requestingUser?: AuthUser) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, isFree: true },
  });
  if (!course) throw AppError.notFound("Course not found");

  const topics = await prisma.topic.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
  });

  // Free courses: return full content
  if (course.isFree) return topics;

  // Staff roles: always full content
  const staffRoles: string[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.EDUCATION_HEAD, Role.MENTOR];
  if (requestingUser && staffRoles.includes(requestingUser.role)) return topics;

  // Students: check enrollment
  if (requestingUser?.role === Role.STUDENT) {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: requestingUser.id,
        status: "ACCEPTED",
        classroom: { courses: { some: { courseId } } },
      },
    });
    if (enrollment) return topics;
  }

  // Not enrolled or unauthenticated: strip content
  return topics.map(({ id, title, order }) => ({ id, title, order }));
}

/**
 * Create a topic for a course.
 * Enforces ordering: the `order` value must be exactly `maxOrder + 1` to
 * keep topics sequential and prevent gaps or duplicates.
 */
export async function createTopic(
  courseId: string,
  input: CreateTopicInput,
  actor: AuthUser,
) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, schoolId: true },
  });
  if (!course) throw AppError.notFound("Course not found");

  // Scope check for ADMIN
  if (actor.role === Role.ADMIN && course.schoolId !== actor.schoolId) {
    throw AppError.forbidden("You can only manage topics for your school's courses");
  }

  // Validate ordering: find current max order
  const maxOrderTopic = await prisma.topic.findFirst({
    where: { courseId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const nextOrder = (maxOrderTopic?.order ?? 0) + 1;

  if (input.order !== nextOrder) {
    throw AppError.badRequest(
      `Topic order must be sequential. Expected order ${nextOrder}, got ${input.order}.`,
    );
  }

  return prisma.topic.create({
    data: {
      courseId,
      title: input.title,
      order: input.order,
      videoUrl: input.videoUrl ?? null,
      content: input.content ?? null,
    },
  });
}

/**
 * Update a topic's content or metadata.
 * Reordering is allowed but must not create duplicate order values.
 */
export async function updateTopic(
  topicId: string,
  input: UpdateTopicInput,
  actor: AuthUser,
) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { course: { select: { schoolId: true } } },
  });
  if (!topic) throw AppError.notFound("Topic not found");

  // Scope check for ADMIN
  if (actor.role === Role.ADMIN && topic.course.schoolId !== actor.schoolId) {
    throw AppError.forbidden("You can only manage topics for your school's courses");
  }

  // Validate ordering collision if order is being changed
  if (input.order !== undefined && input.order !== topic.order) {
    const collision = await prisma.topic.findFirst({
      where: { courseId: topic.courseId, order: input.order, id: { not: topicId } },
    });
    if (collision) {
      throw AppError.conflict(
        `Order ${input.order} is already taken by topic "${collision.title}". Reorder that topic first.`,
      );
    }
  }

  return prisma.topic.update({
    where: { id: topicId },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.order !== undefined && { order: input.order }),
      ...(input.videoUrl !== undefined && { videoUrl: input.videoUrl }),
      ...(input.content !== undefined && { content: input.content }),
    },
  });
}

/**
 * Delete a topic and re-sequence remaining topics to keep order gapless.
 */
export async function deleteTopic(topicId: string, actor: AuthUser) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { course: { select: { schoolId: true } } },
  });
  if (!topic) throw AppError.notFound("Topic not found");

  if (actor.role === Role.ADMIN && topic.course.schoolId !== actor.schoolId) {
    throw AppError.forbidden("You can only manage topics for your school's courses");
  }

  // Delete the topic
  await prisma.topic.delete({ where: { id: topicId } });

  // Re-sequence remaining topics
  const remainingTopics = await prisma.topic.findMany({
    where: { courseId: topic.courseId, order: { gt: topic.order } },
    orderBy: { order: "asc" },
  });

  await Promise.all(
    remainingTopics.map((t, i) =>
      prisma.topic.update({
        where: { id: t.id },
        data: { order: topic.order + i },
      }),
    ),
  );

  return { message: "Topic deleted and remaining topics re-sequenced" };
}
