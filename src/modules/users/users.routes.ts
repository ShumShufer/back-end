import { Router } from "express";
import * as usersController from "./users.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";

const router = Router();

/**
 * GET /users/:id
 * Get user profile by ID (protected route)
 */
router.get("/:id", authenticate, usersController.getUserById);

export default router;
