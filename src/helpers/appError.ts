/**
 * Centralized Application Error class.
 * All predictable operational errors throw instances of AppError,
 * which are captured by the global errorHandler middleware.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code = "BAD_REQUEST", details?: unknown): AppError {
    return new AppError(message, 400, code, details);
  }

  static unauthorized(message = "Unauthorized access", code = "UNAUTHORIZED", details?: unknown): AppError {
    return new AppError(message, 401, code, details);
  }

  static forbidden(message = "You do not have permission to perform this action", code = "FORBIDDEN", details?: unknown): AppError {
    return new AppError(message, 403, code, details);
  }

  static notFound(message = "Resource not found", code = "NOT_FOUND", details?: unknown): AppError {
    return new AppError(message, 404, code, details);
  }

  static conflict(message = "Resource already exists", code = "CONFLICT", details?: unknown): AppError {
    return new AppError(message, 409, code, details);
  }
}
