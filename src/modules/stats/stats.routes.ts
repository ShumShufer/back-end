import { Router } from "express";
import * as statsController from "./stats.controller.js";

const router = Router();

// GET /stats/platform — public landing-page statistics
router.get("/platform", statsController.getPlatformStats);

export default router;
