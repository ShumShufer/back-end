import jwt from "jsonwebtoken";
import { envConfig } from "../config/envConfig.js";
import type { JwtPayload, AuthUser } from "../types/auth.types.js";
import { AppError } from "./appError.js";

/**
 * Sign a short-lived Access Token (~15m).
 */
export function signAccessToken(
  payload: Omit<JwtPayload, "iat" | "exp">,
): string {
  return jwt.sign(payload, envConfig.JWT_ACCESS_SECRET, {
    expiresIn: envConfig.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Sign a long-lived Refresh Token (~7d).
 */
export function signRefreshToken(
  payload: Omit<JwtPayload, "iat" | "exp">,
): string {
  return jwt.sign(payload, envConfig.JWT_REFRESH_SECRET, {
    expiresIn: envConfig.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Verify and decode an Access Token.
 * Maps decoded claims to the strongly typed AuthUser.
 */
export function verifyAccessToken(token: string): AuthUser {
  try {
    const decoded = jwt.verify(
      token,
      envConfig.JWT_ACCESS_SECRET,
    ) as JwtPayload;
    const authUser: AuthUser = {
      id: decoded.sub,
      role: decoded.role,
    };

    if (decoded.schoolId !== undefined) {
      authUser.schoolId = decoded.schoolId;
    }

    if (decoded.tokenVersion !== undefined) {
      authUser.tokenVersion = decoded.tokenVersion;
    }

    return authUser;
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError("Access token has expired", 401, "TOKEN_EXPIRED");
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new AppError("Invalid access token", 401, "INVALID_TOKEN");
    }
    throw new AppError("Token verification failed", 401, "UNAUTHORIZED");
  }
}

/**
 * Verify and decode a Refresh Token.
 */
export function verifyRefreshToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, envConfig.JWT_REFRESH_SECRET) as JwtPayload;
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(
        "Refresh token has expired",
        401,
        "REFRESH_TOKEN_EXPIRED",
      );
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
    }
    throw new AppError(
      "Refresh token verification failed",
      401,
      "UNAUTHORIZED",
    );
  }
}
