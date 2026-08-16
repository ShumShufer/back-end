import type { NextFunction, Request, Response } from "express";

import { AppError } from "../helpers/appError.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const appError =
    err instanceof AppError ? err : (
      new AppError(
        err instanceof Error ? err.message : "Internal Server Error",
        500,
        "INTERNAL_SERVER_ERROR",
      )
    );

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
