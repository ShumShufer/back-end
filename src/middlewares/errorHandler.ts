import type { NextFunction, Request, Response } from "express";

import { AppError } from "../helpers/appError.js";

interface PrismaKnownError {
  code: string;
  clientVersion: string;
  meta?: unknown;
}

function isPrismaError(err: unknown): err is PrismaKnownError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    "clientVersion" in err &&
    typeof (err as PrismaKnownError).code === "string" &&
    typeof (err as PrismaKnownError).clientVersion === "string"
  );
}

function isNamedError(err: unknown, name: string): err is Error {
  return err instanceof Error && err.name === name;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else if (isPrismaError(err)) {
    if (err.code === "P2002") {
      appError = AppError.conflict("A record with that value already exists", "UNIQUE_CONSTRAINT_VIOLATION", err.meta);
    } else if (err.code === "P2025") {
      appError = AppError.notFound("Record not found", "RECORD_NOT_FOUND", err.meta);
    } else {
      appError = AppError.badRequest("Database request error", "DB_ERROR", { code: err.code, meta: err.meta });
    }
  } else if (isNamedError(err, "TokenExpiredError")) {
    appError = AppError.unauthorized("Session expired, please log in again", "TOKEN_EXPIRED");
  } else if (isNamedError(err, "JsonWebTokenError")) {
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
