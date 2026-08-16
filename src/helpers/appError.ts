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

  static unauthorized(message = "Unauthorized access", code = "UNAUTHORIZED"): AppError {
    return new AppError(message, 401, code);
  }

  static forbidden(message = "You do not have permission to perform this action", code = "FORBIDDEN"): AppError {
    return new AppError(message, 403, code);
  }

  static notFound(message = "Resource not found", code = "NOT_FOUND"): AppError {
    return new AppError(message, 404, code);
  }

  static conflict(message = "Resource already exists", code = "CONFLICT"): AppError {
    return new AppError(message, 409, code);
  }
}
