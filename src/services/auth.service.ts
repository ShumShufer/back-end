import prisma from "../config/db.js";
import { AppError } from "../helpers/appError.js";
import { hashPassword, comparePassword } from "../helpers/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../helpers/jwt.js";
import { verifyWithFayda as verifyPhoneWithFayda } from "../helpers/faydaClient.js";
import type {
  RegisterInput,
  LoginInput,
  VerifyFaydaInput,
} from "../validators/auth.schema.js";
import type { Role } from "../types/auth.types.js";

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    phone: string | null;
    firstName: string;
    lastName: string;
    role: string;
    verificationStatus: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Register a new user
 * Business logic:
 * - Check for duplicate email/phone
 * - Hash password
 * - Create user with PENDING verification status
 * - Return user with tokens
 */
export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { email, phone, password, fullName } = input;

  // Check for duplicate email or phone
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { phone }],
    },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw AppError.conflict("Email already registered");
    }
    throw AppError.conflict("Phone number already registered");
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Extract first and last names from fullName
  const nameParts = fullName.trim().split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      phone,
      passwordHash,
      firstName,
      lastName,
      role: "STUDENT", // Default role for new registrations
      dateOfBirth: new Date(), // Placeholder - should be collected separately
      verificationStatus: "PENDING",
    },
  });

  // Generate tokens
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role as Role,
  });

  const refreshToken = signRefreshToken({
    sub: user.id,
    role: user.role as Role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      verificationStatus: user.verificationStatus,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Login user with email/phone and password
 * Business logic:
 * - Find user by email or phone
 * - Compare password
 * - Prevent login if verificationStatus === REJECTED
 * - Generate and return tokens
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
  const { email, phone, password } = input;

  if (!email && !phone) {
    throw AppError.badRequest("Email or phone number is required");
  }

  // Find user by email or phone
  const user = await prisma.user.findFirst({
    where: {
      OR: [email ? { email } : {}, phone ? { phone } : {}],
    },
  });

  if (!user) {
    throw AppError.unauthorized("Invalid email/phone or password");
  }

  // Check verification status
  if (user.verificationStatus === "REJECTED") {
    throw AppError.unauthorized(
      "Your account has been rejected and cannot login",
    );
  }

  // Compare password
  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw AppError.unauthorized("Invalid email/phone or password");
  }

  // Generate tokens
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role as Role,
  });

  const refreshToken = signRefreshToken({
    sub: user.id,
    role: user.role as Role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      verificationStatus: user.verificationStatus,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Refresh access token using a valid refresh token
 * Business logic:
 * - Verify the refresh token
 * - Extract user ID
 * - Fetch user to get latest role
 * - Generate new access token
 * - Optionally generate new refresh token
 */
export async function refreshTokens(
  refreshToken: string,
): Promise<TokenResponse> {
  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken);

  // Fetch user to get latest role and info
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user) {
    throw AppError.unauthorized("User not found");
  }

  // Generate new access token
  const newAccessToken = signAccessToken({
    sub: user.id,
    role: user.role as Role,
  });

  // Optionally generate new refresh token (rotate refresh token)
  const newRefreshToken = signRefreshToken({
    sub: user.id,
    role: user.role as Role,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * Logout user (invalidate refresh token)
 * Note: With stateless JWT, logout is primarily a client-side operation.
 * Token blacklisting can be implemented later if needed.
 */
export async function logout(): Promise<void> {
  // For stateless JWT, logout is handled client-side by removing tokens
  // Token blacklisting can be implemented in the future using Redis
  return;
}

/**
 * Verify user with Fayda
 * Business logic:
 * - Call Fayda verification client
 * - Update user's verificationStatus to VERIFIED if successful
 * - Update faydaId if available
 * - Handle expired refresh tokens gracefully
 */
export async function verifyWithFayda(
  userId: string,
  input: VerifyFaydaInput,
): Promise<{ message: string; verificationStatus: string }> {
  const { phone } = input;

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw AppError.notFound("User not found");
  }

  // Call Fayda verification
  const faydaResponse = await verifyPhoneWithFayda(phone);

  if (!faydaResponse.verified) {
    throw AppError.unauthorized(
      faydaResponse.error || "Fayda verification failed",
    );
  }

  // Update user's verification status
  const updateData: Record<string, unknown> = {
    verificationStatus: "VERIFIED",
  };
  if (faydaResponse.idNumber) {
    updateData.faydaId = faydaResponse.idNumber;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return {
    message: "Verification successful",
    verificationStatus: updatedUser.verificationStatus,
  };
}

/**
 * Get current user by ID
 */
export async function getCurrentUser(userId: string): Promise<{
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  role: string;
  verificationStatus: string;
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
  };
}
