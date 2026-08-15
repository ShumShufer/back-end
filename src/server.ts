import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

const server = app.listen(env.port, () => {
  logger.info(
    `Server running on port ${env.port} in ${env.nodeEnv} mode`
  );
});

function shutdown(signal: string): void {
  logger.info(`${signal} received. Shutting down server...`);

  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
