import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface StoredFile {
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

/**
 * Ensures the uploads directory exists on disk.
 */
async function ensureUploadsDirExists(): Promise<void> {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch {
    // Already exists or created
  }
}

/**
 * Saves a binary file buffer to the uploads storage and returns its metadata and public URL.
 */
export async function saveFile(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string,
): Promise<StoredFile> {
  await ensureUploadsDirExists();

  const ext = path.extname(originalFilename) || ".bin";
  const uniqueName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  const filePath = path.join(UPLOADS_DIR, uniqueName);

  await fs.writeFile(filePath, buffer);

  return {
    url: `/uploads/${uniqueName}`,
    filename: uniqueName,
    originalName: originalFilename,
    mimeType,
    sizeBytes: buffer.length,
  };
}

/**
 * Deletes a stored file by filename.
 */
export async function deleteFile(filename: string): Promise<boolean> {
  try {
    const safeFilename = path.basename(filename);
    const filePath = path.join(UPLOADS_DIR, safeFilename);
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves the absolute path for a stored filename.
 */
export function getFilePath(filename: string): string {
  const safeFilename = path.basename(filename);
  return path.join(UPLOADS_DIR, safeFilename);
}
