import { z } from "zod";

// Regex patterns for validation
const phoneRegex = /^(\+251|0)[1-9]\d{8}$/; // Ethiopian phone numbers
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/; // Min 8 chars: lowercase, uppercase, digit, special char

// Register schema
export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .regex(
        phoneRegex,
        "Invalid phone number. Use Ethiopian format (e.g., 0911223344)",
      ),
    password: z
      .string()
      .regex(
        passwordRegex,
        "Password must be at least 8 characters and contain uppercase, lowercase, digit, and special character",
      ),
    passwordConfirm: z.string(),
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().regex(phoneRegex, "Invalid phone number").optional(),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Refresh token schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// Verify Fayda schema
export const verifyFaydaSchema = z.object({
  phone: z.string().regex(phoneRegex, "Invalid phone number"),
  verificationCode: z.string().min(1, "Verification code is required"),
});

export type VerifyFaydaInput = z.infer<typeof verifyFaydaSchema>;

// Me (current user) schema - no body required
export const meSchema = z.object({});

export type MeInput = z.infer<typeof meSchema>;

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// Reset password schema
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: z
      .string()
      .regex(
        passwordRegex,
        "Password must be at least 8 characters and contain uppercase, lowercase, digit, and special character",
      ),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
