import type { Router } from "express";
import { Router as createRouter } from "express";
import * as authController from "./auth.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { validate } from "../../shared/middlewares/validate.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  verifyFaydaSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.schema.js";

const router: Router = createRouter();

/**
 * Public routes
 */
router.post("/register", validate(registerSchema), authController.register);

router.post("/login", validate(loginSchema), authController.login);

router.post(
  "/refresh",
  validate(refreshTokenSchema),
  authController.refreshToken,
);

// POST /auth/forgot-password — request a reset token (public)
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

// POST /auth/reset-password — submit token + new password (public)
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword,
);

/**
 * Protected routes (require authentication)
 */
router.post("/logout", authenticate, authController.logout);

router.post(
  "/verify-fayda",
  authenticate,
  validate(verifyFaydaSchema),
  authController.verifyFayda,
);

router.get("/me", authenticate, authController.getCurrentUser);

export default router;
