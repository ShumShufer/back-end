import { z } from "zod";

const roleEnum = z.enum(["SUPER_ADMIN", "ADMIN", "EDUCATION_HEAD", "MENTOR", "STUDENT"]);
const verificationStatusEnum = z.enum(["PENDING", "VERIFIED", "REJECTED"]);

export const queryUsersSchema = z.object({
  role: roleEnum.optional(),
  search: z.string().optional(),
  verificationStatus: verificationStatusEnum.optional(),
  schoolId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const createUserSchema = z
  .object({
    email: z.string().email(),
    phone: z.string().regex(/^(\+?251|0)?9\d{8}$/, "Invalid Ethiopian phone number").optional(),
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    password: z
      .string()
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/,
        "Password must be at least 8 characters with uppercase, lowercase, digit and special character",
      )
      .optional(),
    role: roleEnum,
    schoolId: z.string().uuid().nullable().optional(),
  })
  .strict();

export const updateUserSchema = z
  .object({
    firstName: z.string().min(2).max(50).optional(),
    lastName: z.string().min(2).max(50).optional(),
    phone: z.string().regex(/^(\+?251|0)?9\d{8}$/).optional(),
    role: roleEnum.optional(),
    schoolId: z.string().uuid().nullable().optional(),
    verificationStatus: verificationStatusEnum.optional(),
  })
  .strict();

export type QueryUsersInput = z.infer<typeof queryUsersSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const setUserStatusSchema = z.object({
  status: z.enum(["PENDING", "VERIFIED", "REJECTED"]),
});

export const assignUserRoleSchema = z.object({
  role: roleEnum,
});
