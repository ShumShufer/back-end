import prisma from "../config/db.js";
import { AppError } from "./appError.js";

export interface PriceRecommendationResult {
  recommendedPrice: number;
  marketAverage: number | null;
  lowerBound: number | null;
  upperBound: number | null;
  confidence: "low" | "medium" | "high";
  sampleSize?: number;
  note: string;
}

/**
 * Calculates a suggested price for a course by analyzing the pricing
 * distribution of comparable existing courses in the same school (or platform-wide).
 */
export async function calculatePriceRecommendation(
  courseId: string,
): Promise<PriceRecommendationResult> {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw AppError.notFound("Course not found");

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
      sampleSize: 0,
      note: "Not enough market data. Recommendation is based on a platform default.",
    };
  }

  const prices = comparableCourses.map((c) => Number(c.price));
  const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;

  const variance =
    prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
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
