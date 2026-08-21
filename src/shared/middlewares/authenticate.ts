import type { NextFunction, Request, Response } from "express";

import { AppError } from "../helpers/appError.js";
import { verifyAccessToken } from "../helpers/jwt.js";

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(AppError.unauthorized("Missing or invalid access token"));
    return;
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    next(AppError.unauthorized("Missing or invalid access token"));
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
    return;
  } catch (error) {
    next(
      error instanceof Error ? error : (
        AppError.unauthorized("Authentication failed")
      ),
    );
  }
}
