import { Router } from "express";
import * as usersController from "../controllers/users.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();

/**
 * GET /users/:id
 * Get user profile by ID (protected route)
 */
router.get("/:id", authenticate, usersController.getUserById);

export default router;
