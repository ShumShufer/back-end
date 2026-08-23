import { Router } from "express";
import * as studentsController from "./students.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";

const router = Router({ mergeParams: true });

router.get("/:id/progress", authenticate, studentsController.getStudentProgress);

export default router;
