import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";

const server = app.listen(env.port, () => {
  logger.info(
    `Server running on port ${env.port} in ${env.nodeEnv} mode`
  );
});

const shutdown = (signal: string): void => {
  logger.info(`${signal} received. Shutting down server...`);

  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
