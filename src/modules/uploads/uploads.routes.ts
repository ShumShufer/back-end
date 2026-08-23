import { Router } from "express";
import * as uploadsController from "./uploads.controller.js";
import { authenticate } from "../../shared/middlewares/authenticate.js";
import { validate } from "../../shared/middlewares/validate.js";
import { uploadFileSchema } from "./uploads.schema.js";

const router = Router();

// POST /uploads — generate file storage URL / upload asset
router.post(
  "/",
  authenticate,
  validate(uploadFileSchema),
  uploadsController.uploadFile,
);

export default router;
