import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { Role } from "../types/auth.types.js";

const router = Router();

/**
 * GET /admin/dashboard
 * Super Admin platform-wide metrics.
 */
router.get(
  "/dashboard",
  authenticate,
  authorize(Role.SUPER_ADMIN),
  adminController.getSuperAdminDashboard,
);

export default router;
