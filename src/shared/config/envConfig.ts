import { z } from "zod";
import dotenv from "dotenv";

// Load .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .default("3000")
    .transform((val) => parseInt(val, 10)),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
});

export type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      "Invalid environment variables:",
      JSON.stringify(parsed.error.format(), null, 2),
    );
    process.exit(1);
  }

  return parsed.data;
}

export const envConfig = validateEnv();
