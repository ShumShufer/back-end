import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service.js";
import { apiResponse } from "../helpers/apiResponse.js";

/**
 * Register a new user
 * POST /auth/register
 */
export function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const result = await authService.register(req.body);
    res
      .status(201)
      .json(apiResponse(result, "User registered successfully", 201));
  })().catch(next);
}

/**
 * Login user
 * POST /auth/login
 */
export function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const result = await authService.login(req.body);
    res.status(200).json(apiResponse(result, "Login successful"));
  })().catch(next);
}

/**
 * Refresh access token
 * POST /auth/refresh
 */
export function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    const { refreshToken } = req.body;
    const result = await authService.refreshTokens(refreshToken);
    res.status(200).json(apiResponse(result, "Token refreshed"));
  })().catch(next);
}

/**
 * Logout user
 * POST /auth/logout
 * Protected route - requires authentication
 */
export function logout(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    await authService.logout();
    res.status(200).json(apiResponse(null, "Logout successful"));
  })().catch(next);
}

/**
 * Verify user with Fayda
 * POST /auth/verify-fayda
 * Protected route - requires authentication
 */
export function verifyFayda(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    if (!req.user) {
      throw new Error("User not authenticated");
    }
    const result = await authService.verifyWithFayda(req.user.id, req.body);
    res.status(200).json(apiResponse(result, "Fayda verification successful"));
  })().catch(next);
}

/**
 * Get current user profile
 * GET /auth/me
 * Protected route - requires authentication
 */
export function getCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  return (async () => {
    if (!req.user) {
      throw new Error("User not authenticated");
    }
    const result = await authService.getCurrentUser(req.user.id);
    res.status(200).json(apiResponse(result, "User profile retrieved"));
  })().catch(next);
}
