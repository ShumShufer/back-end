import crypto from "crypto";
import prisma from "../../shared/config/db.js";
import { AppError } from "../../shared/helpers/appError.js";
import { hashPassword, comparePassword } from "../../shared/helpers/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../shared/helpers/jwt.js";
import { verifyWithFayda as verifyPhoneWithFayda } from "../../shared/helpers/faydaClient.js";
import type {
  RegisterInput,
  LoginInput,
  VerifyFaydaInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "./auth.schema.js";
import type { Role } from "../../shared/types/auth.types.js";

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    phone: string | null;
    firstName: string;
    lastName: string;
    role: string;
    verificationStatus: string;
    schoolId: string | null;
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
      OR: [{ email }, ...(phone ? [{ phone }] : [])],
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
      ...(phone ? { phone } : {}),
      passwordHash,
      firstName,
      lastName,
      role: "STUDENT", // Default role for new registrations
      dateOfBirth: new Date(), // Placeholder - should be collected separately
      verificationStatus: "PENDING",
    },
  });

  // Generate tokens (schoolId rides along so scopeToSchool can authorize)
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role as Role,
    schoolId: user.schoolId ?? null,
  });

  const refreshToken = signRefreshToken({
    sub: user.id,
    role: user.role as Role,
    schoolId: user.schoolId ?? null,
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
      schoolId: user.schoolId,
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

  // Generate tokens (schoolId rides along so scopeToSchool can authorize)
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role as Role,
    schoolId: user.schoolId ?? null,
  });

  const refreshToken = signRefreshToken({
    sub: user.id,
    role: user.role as Role,
    schoolId: user.schoolId ?? null,
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
      schoolId: user.schoolId,
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
    schoolId: user.schoolId ?? null,
  });

  // Optionally generate new refresh token (rotate refresh token)
  const newRefreshToken = signRefreshToken({
    sub: user.id,
    role: user.role as Role,
    schoolId: user.schoolId ?? null,
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
  schoolId: string | null;
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
    schoolId: user.schoolId,
  };
}

/**
 * Request a password reset.
 * Generates a secure random token stored in the DB, valid for 1 hour.
 * In production this token would be emailed to the user.
 * For development/testing the token is returned directly in the response.
 */
export async function forgotPassword(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  // Always return success to prevent user enumeration attacks
  if (!user) {
    return { message: "If an account with that email exists, a reset token has been sent." };
  }

  // Invalidate any existing unused tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  // Generate a cryptographically secure random token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  // TODO: In production, send email with reset link containing this token.
  // e.g. `https://app.shumshufer.com/reset-password?token=${token}`

  return {
    message: "If an account with that email exists, a reset token has been sent.",
    // NOTE: Only expose token in development/testing. Remove in production!
    ...(process.env["NODE_ENV"] !== "production" ? { resetToken: token } : {}),
  };
}

/**
 * Reset the user's password using a valid, unexpired reset token.
 */
export async function resetPassword(input: ResetPasswordInput) {
  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { token: input.token },
    include: { user: true },
  });

  if (!resetRecord) {
    throw AppError.badRequest("Invalid or expired reset token");
  }

  if (resetRecord.usedAt) {
    throw AppError.badRequest("This reset token has already been used");
  }

  if (resetRecord.expiresAt < new Date()) {
    throw AppError.badRequest("Reset token has expired. Please request a new one.");
  }

  // Hash the new password
  const passwordHash = await hashPassword(input.password);

  // Update password and mark token as used atomically
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { message: "Password reset successfully. You can now log in with your new password." };
}
