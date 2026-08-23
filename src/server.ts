import app from './app.js';
import prisma from "./shared/config/db.js";
import { envConfig } from "./shared/config/envConfig.js";

async function startServer() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('Connected to Database');

    const server = app.listen(envConfig.PORT, () => {
      console.log(`Server is running in ${envConfig.NODE_ENV} mode on port ${envConfig.PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

startServer();
