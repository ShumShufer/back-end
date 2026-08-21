import { Router } from "express";
import * as adminController from "./admin.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { authorize } from "../../shared/middlewares/authorize.js";
import { Role } from "../../shared/types/auth.types.js";

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
