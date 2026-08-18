import prisma from "../config/db.js";
import { AppError } from "../helpers/appError.js";
import type {
  CreateBranchInput,
  UpdateBranchInput,
} from "../validators/branch.schema.js";

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
