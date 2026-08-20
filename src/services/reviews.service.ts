import prisma from "../config/db.js";
import { AppError } from "../helpers/appError.js";
import { Role, type AuthUser } from "../types/auth.types.js";
import type {
  CreateReviewInput,
  QueryReviewsInput,
} from "../validators/reviews.schema.js";

/**
 * Leave a review and rating for a school by a student.
 * Recalculates and updates the school's overall rating (`School.rating`).
 */
export async function createSchoolReview(
  schoolId: string,
  input: CreateReviewInput,
  actor: AuthUser,
) {
  if (actor.role !== Role.STUDENT) {
    throw AppError.forbidden("Only students can leave school reviews");
  }

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw AppError.notFound("School not found");

  // Create the review
  const review = await prisma.review.create({
    data: {
      schoolId,
      studentId: actor.id,
      rating: input.rating,
      comment: input.comment ?? null,
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  // Recalculate average school rating
  const allReviews = await prisma.review.findMany({
    where: { schoolId },
    select: { rating: true },
  });

  const avgRating =
    allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

  await prisma.school.update({
    where: { id: schoolId },
    data: { rating: Number(avgRating.toFixed(1)) },
  });

  return review;
}

/**
 * Get all reviews for a school with summary stats.
 */
export async function getSchoolReviews(schoolId: string, query: QueryReviewsInput) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { schoolId },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    }),
    prisma.review.count({ where: { schoolId } }),
  ]);

  return {
    reviews,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}
