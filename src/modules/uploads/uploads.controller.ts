import type { Request, Response, NextFunction } from "express";
import * as uploadsService from "./uploads.service.js";
import type { UploadFileInput } from "./uploads.schema.js";

/**
 * POST /uploads
 */
export async function uploadFile(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await uploadsService.uploadFile(req.body as UploadFileInput);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
