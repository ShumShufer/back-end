import type { Request, Response, NextFunction } from "express";
import * as uploadsService from "./uploads.service.js";
import type { UploadFileInput } from "./uploads.schema.js";
import { apiResponse } from "../../shared/helpers/apiResponse.js";

/**
 * POST /uploads
 */
export async function uploadFile(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await uploadsService.uploadFile(req.body as UploadFileInput);
    res.status(201).json(apiResponse(result, "File uploaded successfully", 201));
  } catch (err) {
    next(err);
  }
}
