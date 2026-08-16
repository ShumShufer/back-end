import { Router } from "express";
import authRoutes from "./auth.routes.js";
import usersRoutes from "./users.routes.js";

const router = Router();

/**
 * API Routes
 */
router.use("/auth", authRoutes);
router.use("/users", usersRoutes);

export default router;
