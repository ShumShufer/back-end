import { Router } from "express";
import * as uploadsController from "../controllers/uploads.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import { uploadFileSchema } from "../validators/uploads.schema.js";

const router = Router();

// POST /uploads — generate file storage URL / upload asset
router.post(
  "/",
  authenticate,
  validate(uploadFileSchema),
  uploadsController.uploadFile,
);

export default router;
