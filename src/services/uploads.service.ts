import crypto from "crypto";
import path from "path";
import type { UploadFileInput } from "../validators/uploads.schema.js";

export interface UploadResult {
  url: string;
  filename: string;
  contentType: string;
  sizeBytes?: number;
}

/**
 * Upload service abstraction.
 * Generates structured CDN/storage URLs for uploaded assets and assignment files.
 */
export async function uploadFile(input: UploadFileInput): Promise<UploadResult> {
  const ext = path.extname(input.filename) || ".bin";
  const uniqueName = `${crypto.randomUUID()}${ext}`;

  // Public asset URL path
  const storageUrl = `/uploads/${uniqueName}`;

  return {
    url: storageUrl,
    filename: uniqueName,
    contentType: input.contentType,
  };
}
