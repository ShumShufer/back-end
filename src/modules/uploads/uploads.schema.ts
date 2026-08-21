import { z } from "zod";

export const uploadFileSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  fileData: z.string().optional(), // base64 or storage abstraction
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
