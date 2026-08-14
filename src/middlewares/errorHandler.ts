import { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error(error.message);

  if (res.headersSent) {
    next(error);
    return;
  }

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "Something went wrong"
          : error.message,
    },
  });
};
