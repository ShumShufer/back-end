import { Router } from "express";
import * as studentsController from "./students.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";

const router = Router({ mergeParams: true });

// GET /students/:id/progress
router.get("/:id/progress", authenticate, studentsController.getStudentProgress);

// GET /students/:id/performance-report
router.get("/:id/performance-report", authenticate, studentsController.getStudentPerformanceReport);

// GET /students/:id/submissions
router.get("/:id/submissions", authenticate, studentsController.getStudentSubmissions);

export default router;
