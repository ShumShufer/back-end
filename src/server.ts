import app from './app.js';
import { envConfig } from './config/envConfig.js';

const startServer = async () => {
  try {
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
