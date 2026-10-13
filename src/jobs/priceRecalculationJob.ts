import prisma from "../shared/config/db.js";
import logger from "../shared/config/logger.js";

export interface PricingMetrics {
  totalCourses: number;
  paidCourses: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
}

/**
 * Background job to recalculate platform and school pricing distributions.
 */
export async function runPriceRecalculationJob(): Promise<{
  platformMetrics: PricingMetrics;
  schoolsProcessed: number;
}> {
  logger.info("[Job:PriceRecalculation] Running platform-wide course pricing metrics recalculation...");

  const allCourses = await prisma.course.findMany({
    where: { isFree: false },
    select: { id: true, price: true, schoolId: true },
  });

  if (allCourses.length === 0) {
    logger.info("[Job:PriceRecalculation] No paid courses found. Skipping recalculation.");
    return {
      platformMetrics: {
        totalCourses: 0,
        paidCourses: 0,
        averagePrice: 0,
        minPrice: 0,
        maxPrice: 0,
      },
      schoolsProcessed: 0,
    };
  }

  const prices = allCourses.map((c) => Number(c.price));
  const totalCourses = await prisma.course.count();
  const paidCourses = prices.length;
  const sum = prices.reduce((a, b) => a + b, 0);
  const averagePrice = Math.round(sum / paidCourses);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const platformMetrics: PricingMetrics = {
    totalCourses,
    paidCourses,
    averagePrice,
    minPrice,
    maxPrice,
  };

  // Group by school
  const schoolIds = new Set(allCourses.map((c) => c.schoolId).filter(Boolean) as string[]);

  logger.info("[Job:PriceRecalculation] Recalculation complete.", {
    platformMetrics,
    schoolsCount: schoolIds.size,
  });

  return {
    platformMetrics,
    schoolsProcessed: schoolIds.size,
  };
}
