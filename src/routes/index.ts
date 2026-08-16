import { Router } from "express";
import authRoutes from "./auth.routes.js";

const router = Router();

/**
 * API Routes
 */
router.use("/auth", authRoutes);

// Add more routes here as they are created
// router.use("/users", usersRoutes);
// router.use("/schools", schoolsRoutes);
// etc.

export default router;
