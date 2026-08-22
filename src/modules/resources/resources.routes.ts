import { Router } from "express";
import * as resourcesController from "./resources.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { authorize } from "../../shared/middlewares/authorize.js";
import { validate } from "../../shared/middlewares/validate.js";
import { createResourceSchema } from "./resources.schema.js";
import { Role } from "../../shared/types/auth.types.js";

// Mounted at /classrooms/:id (mergeParams: true)
const router = Router({ mergeParams: true });

router.get("/resources", authenticate, resourcesController.getResources);

router.post(
  "/resources",
  authenticate,
  authorize(Role.ADMIN, Role.EDUCATION_HEAD, Role.MENTOR, Role.SUPER_ADMIN),
  validate(createResourceSchema),
  resourcesController.createResource,
);

export default router;
