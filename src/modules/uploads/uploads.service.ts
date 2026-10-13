import crypto from "crypto";
import path from "path";
import type { UploadFileInput } from "./uploads.schema.js";
import { saveFile } from "../../shared/helpers/fileStorage.js";

export interface UploadResult {
  url: string;
  filename: string;
  contentType: string;
  sizeBytes?: number;
}

/**
 * Upload service abstraction.
 * If fileData (base64) is provided, writes to persistent file storage.
 * Otherwise generates structured asset URL and unique filename reference.
 */
export async function uploadFile(input: UploadFileInput): Promise<UploadResult> {
  if (input.fileData) {
    const splitParts = input.fileData.split(";base64,");
    const base64Data = splitParts.length > 1 ? splitParts[1]! : input.fileData;
    const buffer = Buffer.from(base64Data, "base64");
    const stored = await saveFile(buffer, input.filename, input.contentType);
    return {
      url: stored.url,
      filename: stored.filename,
      contentType: input.contentType,
      sizeBytes: stored.sizeBytes,
    };
  }

  const ext = path.extname(input.filename) || ".bin";
  const uniqueName = `${crypto.randomUUID()}${ext}`;
  const storageUrl = `/uploads/${uniqueName}`;

  return {
    url: storageUrl,
    filename: uniqueName,
    contentType: input.contentType,
  };
}
