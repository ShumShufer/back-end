import prisma from "../../shared/config/db.js";
import { AppError } from "../../shared/helpers/appError.js";
import type {
  CreateBranchInput,
  UpdateBranchInput,
  QueryNearbyBranchesInput,
} from "./branch.schema.js";

/**
 * Get all branches for a specific school
 */
export async function getBranchesBySchoolId(schoolId: string) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
  });

  if (!school) {
    throw AppError.notFound("School not found");
  }

  const branches = await prisma.branch.findMany({
    where: { schoolId },
    orderBy: { name: "asc" },
  });

  return branches;
}

/**
 * Get single branch by ID
 */
export async function getBranchById(branchId: string) {
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });

  if (!branch) {
    throw AppError.notFound("Branch not found");
  }

  return branch;
}

/**
 * Create a new branch under a school (ADMIN)
 */
export async function createBranch(schoolId: string, data: CreateBranchInput) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
  });

  if (!school) {
    throw AppError.notFound("School not found");
  }

  const branch = await prisma.branch.create({
    data: {
      schoolId,
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
    },
  });

  return branch;
}

/**
 * Update an existing branch (ADMIN)
 */
export async function updateBranch(branchId: string, data: UpdateBranchInput) {
  const existingBranch = await prisma.branch.findUnique({
    where: { id: branchId },
  });

  if (!existingBranch) {
    throw AppError.notFound("Branch not found");
  }

  const updatedBranch = await prisma.branch.update({
    where: { id: branchId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.address && { address: data.address }),
      ...(data.latitude !== undefined && { latitude: data.latitude }),
      ...(data.longitude !== undefined && { longitude: data.longitude }),
    },
  });

  return updatedBranch;
}

/**
 * Delete a branch (ADMIN)
 */
export async function deleteBranch(branchId: string) {
  const existingBranch = await prisma.branch.findUnique({
    where: { id: branchId },
  });

  if (!existingBranch) {
    throw AppError.notFound("Branch not found");
  }

  await prisma.branch.delete({
    where: { id: branchId },
  });

  return { message: "Branch deleted successfully" };
}

/**
 * Get branches within a given radius of a lat/lng coordinate (public).
 *
 * Uses the Haversine formula to calculate great-circle distance between
 * two points on Earth. Prisma does not support spatial queries natively,
 * so we fetch all branches and filter in-process. This is acceptable
 * because the total number of branches is bounded and small.
 *
 * Haversine formula:
 *   a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlng/2)
 *   distance = 2R * atan2(√a, √(1−a))   where R = 6371 km
 */
export async function getNearbyBranches(query: QueryNearbyBranchesInput) {
  const { lat, lng, radius, page, pageSize } = query;
  const EARTH_RADIUS_KM = 6371;

  // Fetch all branches — we filter by non-null coords and distance in-process.
  // Prisma's generated types for nullable Float don't support { not: null } in
  // this version, so we guard with a runtime null check in the map below.
  const branches = await prisma.branch.findMany({
    include: {
      school: {
        select: { id: true, name: true, status: true },
      },
    },
  });

  // Calculate distance for each branch and filter by radius
  const withDistance = branches
    .filter((branch) => branch.latitude !== null && branch.longitude !== null)
    .map((branch) => {
      const branchLat = branch.latitude as number;
      const branchLng = branch.longitude as number;

      const dLat = ((branchLat - lat) * Math.PI) / 180;
      const dLng = ((branchLng - lng) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((branchLat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);

      const distanceKm =
        2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      return { ...branch, distanceKm };
    })
    .filter((branch) => branch.distanceKm <= radius)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  // Apply pagination after filtering
  const total = withDistance.length;
  const skip = (page - 1) * pageSize;
  const paginated = withDistance.slice(skip, skip + pageSize);

  return {
    branches: paginated,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}
