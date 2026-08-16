export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  EDUCATION_HEAD = "EDUCATION_HEAD",
  MENTOR = "MENTOR",
  STUDENT = "STUDENT",
}

export interface JwtPayload {
  sub: string;
  role: Role;
  schoolId?: string | null;
  tokenVersion?: number;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  role: Role;
  schoolId?: string | null;
  tokenVersion?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
