import prisma from "../config/db.js";
import { AppError } from "../helpers/appError.js";

/**
 * Get user by ID
 * Used for GET /users/:id endpoint
 */
export async function getUserById(userId: string): Promise<{
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: string;
  verificationStatus: string;
  dateOfBirth: Date;
  avatarUrl: string | null;
  createdAt: Date;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw AppError.notFound("User not found");
  }

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    verificationStatus: user.verificationStatus,
    dateOfBirth: user.dateOfBirth,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

/**
 * Get user by email
 * Used internally for verification and lookups
 */
export async function getUserByEmail(email: string): Promise<{
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: string;
  verificationStatus: string;
} | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    verificationStatus: user.verificationStatus,
  };
}

/**
 * Get user by phone
 * Used internally for verification and lookups
 */
export async function getUserByPhone(phone: string): Promise<{
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: string;
  verificationStatus: string;
} | null> {
  const user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    verificationStatus: user.verificationStatus,
  };
}
