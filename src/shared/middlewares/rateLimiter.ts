import type { NextFunction, Request, Response } from "express";

const requestWindow = new Map<string, number[]>();

export function rateLimiter(limit = 100, windowMs = 60_000) {
  return function rateLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const key = (req.ip ??
      req.headers["x-forwarded-for"] ??
      "unknown") as string;
    const cleanKey = key.toString();
    const now = Date.now();
    const timestamps = requestWindow.get(cleanKey) ?? [];
    const recentRequests = timestamps.filter(
      (timestamp) => now - timestamp < windowMs,
    );

    if (recentRequests.length >= limit) {
      res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again later.",
        },
      });
      return;
    }

    recentRequests.push(now);
    requestWindow.set(cleanKey, recentRequests);
    next();
  };
}
