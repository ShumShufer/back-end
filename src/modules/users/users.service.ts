import prisma from "../../shared/config/db.js";
import crypto from "node:crypto";
import { AppError } from "../../shared/helpers/appError.js";
import { hashPassword } from "../../shared/helpers/password.js";
import type { AuthUser } from "../../shared/types/auth.types.js";
import { Role } from "../../shared/types/auth.types.js";
import type { CreateUserInput, QueryUsersInput, UpdateUserInput } from "./users.schema.js";

/** Strip sensitive fields before any user leaves the API. */
function publicUser<T extends { passwordHash?: string }>(user: T): Omit<T, "passwordHash"> {
  const { passwordHash: _passwordHash, ...safe } = user;
  void _passwordHash;
  return safe;
}

export async function getUsers(query: QueryUsersInput, actor: AuthUser) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const where: Record<string, unknown> = {};
  if (actor.role !== Role.SUPER_ADMIN) where.schoolId = actor.schoolId;
  else if (query.schoolId) where.schoolId = query.schoolId;
  if (query.role) where.role = query.role;
  if (query.verificationStatus) where.verificationStatus = query.verificationStatus;
  if (query.search) where.OR = [
    { firstName: { contains: query.search, mode: "insensitive" } },
    { lastName: { contains: query.search, mode: "insensitive" } },
    { email: { contains: query.search, mode: "insensitive" } },
  ];
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: "desc" } }),
    prisma.user.count({ where }),
  ]);
  return { users: users.map(publicUser), meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}

export async function createUser(input: CreateUserInput, actor: AuthUser) {
  if (actor.role !== Role.SUPER_ADMIN && input.schoolId !== actor.schoolId) throw AppError.forbidden("You can only create users for your school");
  const password = input.password ?? (crypto.randomUUID().replace(/-/g, "") + "Aa1!");
  const passwordHash = await hashPassword(password);
  const data = {
    email: input.email,
    phone: input.phone ?? null,
    firstName: input.firstName,
    lastName: input.lastName,
    role: input.role,
    schoolId: input.schoolId ?? null,
    passwordHash,
    dateOfBirth: new Date(),
    verificationStatus: "VERIFIED" as const,
  };
  const user = await prisma.user.create({ data });
  return publicUser(user);
}

export async function updateUser(userId: string, input: UpdateUserInput, actor: AuthUser) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) throw AppError.notFound("User not found");
  const isSelf = existing.id === actor.id;
  if (!isSelf && actor.role !== Role.SUPER_ADMIN && existing.schoolId !== actor.schoolId) throw AppError.forbidden("You can only manage users in your school");
  if (isSelf && (input.role || input.schoolId !== undefined || input.verificationStatus)) throw AppError.forbidden("Profile updates cannot change access settings");

  const data: Record<string, unknown> = {};
  if (input.firstName !== undefined) data.firstName = input.firstName;
  if (input.lastName !== undefined) data.lastName = input.lastName;
  if (input.phone !== undefined) data.phone = input.phone;
  if (actor.role === Role.SUPER_ADMIN || !isSelf) {
    if (input.role !== undefined) data.role = input.role;
    if (input.schoolId !== undefined) data.schoolId = input.schoolId;
    if (input.verificationStatus !== undefined) data.verificationStatus = input.verificationStatus;
  }

  const user = await prisma.user.update({ where: { id: userId }, data });
  return publicUser(user);
}

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
