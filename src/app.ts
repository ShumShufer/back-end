import express from "express";
import { notFound } from "./middlewares/notFound";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

// Parse incoming JSON requests
app.use(express.json());

// Basic health check
app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "API is running",
  });
});

// Handle unknown routes
app.use(notFound);

// Handle application errors
app.use(errorHandler);

export default app;
