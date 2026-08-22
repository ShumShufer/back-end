import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { AppError } from "../helpers/appError.js";

export function validate(
  schema: z.ZodTypeAny,
  source: "body" | "query" | "params" = "body",
) {
  return function validateRequest(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void {
    const requestData = req[source];
    const parsed = schema.safeParse(requestData);

    if (!parsed.success) {
      next(
        AppError.badRequest(
          "Validation failed",
          "VALIDATION_ERROR",
          parsed.error.flatten(),
        ),
      );
      return;
    }

    try {
      Object.defineProperty(req, source, {
        value: parsed.data,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    } catch {
      const requestTarget = req as unknown as Record<string, unknown>;
      requestTarget[source] = parsed.data;
    }
    next();
  };
}
