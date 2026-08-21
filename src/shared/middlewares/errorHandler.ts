import type { NextFunction, Request, Response } from "express";

// Import removed to avoid type inference issues if Prisma client isn't generated
// import { Prisma } from "@prisma/client";
// import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";

import { AppError } from "../helpers/appError.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else if (err && typeof err === "object" && "code" in err && (err as any).clientVersion) {
    // Prisma errors typically have clientVersion and code
    const prismaErr = err as any;
    if (prismaErr.code === "P2002") {
      appError = AppError.conflict("A record with that value already exists", "UNIQUE_CONSTRAINT_VIOLATION", prismaErr.meta);
    } else if (prismaErr.code === "P2025") {
      appError = AppError.notFound("Record not found", "RECORD_NOT_FOUND", prismaErr.meta);
    } else {
      appError = AppError.badRequest("Database request error", "DB_ERROR", { code: prismaErr.code, meta: prismaErr.meta });
    }
  } else if (err && (err as any).name === "TokenExpiredError") {
    appError = AppError.unauthorized("Session expired, please log in again", "TOKEN_EXPIRED");
  } else if (err && (err as any).name === "JsonWebTokenError") {
    appError = AppError.unauthorized("Invalid authentication token", "INVALID_TOKEN");
  } else {
    appError = new AppError(
      err instanceof Error ? err.message : "Internal Server Error",
      500,
      "INTERNAL_SERVER_ERROR",
    );
  }

  const errorPayload: {
    success: boolean;
    error: {
      code: string;
      message: string;
      details?: unknown;
      stack?: string;
    };
  } = {
    success: false,
    error: {
      code: appError.code,
      message: appError.message,
    },
  };

  if (appError.details !== undefined) {
    errorPayload.error.details = appError.details;
  }

  if (process.env.NODE_ENV === "development") {
    const stack =
      (err instanceof Error ? err.stack : undefined) ?? appError.stack;
    if (stack) {
      errorPayload.error.stack = stack;
    }
  }

  res.status(appError.statusCode).json(errorPayload);
}
