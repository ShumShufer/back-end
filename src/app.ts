import express from 'express';
import type { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import router from './routes/index.js';

const app: Express = express();

// Security Middlewares
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: '*', // Configure appropriately for production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging Middleware
app.use(morgan('dev'));

// Built-in body parsing Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Main API Routes
app.use('/api/v1', router);

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Server is up and running' });
});

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    }
  });
});

export default app;
