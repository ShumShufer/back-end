import express from "express";
import type { Express, Request, Response } from "express";
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

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", router);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "OK", message: "Server is up and running" });
});

app.use(notFound);
app.use(errorHandler);

export default app;
