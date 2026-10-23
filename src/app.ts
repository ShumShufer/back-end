import express from "express";
import type { Express, Request, Response } from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import router from "./modules/routes.js";
import { errorHandler } from "./shared/middlewares/errorHandler.js";
import { notFound } from "./shared/middlewares/notFound.js";
import { rateLimiter } from "./shared/middlewares/rateLimiter.js";
import { requestLogger } from "./shared/middlewares/requestLogger.js";
import { securityHeaders } from "./shared/middlewares/securityHeaders.js";

const app: Express = express();

app.use(helmet());
app.use(securityHeaders);
app.use(requestLogger);
app.use(rateLimiter());

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : null;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, server-to-server) or matched origins
      if (!origin || !allowedOrigins || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.use("/api/v1", router);

const healthHandler = (_req: Request, res: Response) => {
  res.status(200).json({ status: "OK", message: "Server is up and running" });
};

app.get("/health", healthHandler);
app.get("/api/v1/health", healthHandler);

app.use(notFound);
app.use(errorHandler);

export default app;
