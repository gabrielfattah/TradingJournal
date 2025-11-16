/**
 * Trading Journal API Server
 * Main entry point for the Express application
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import tradeRoutes from './routes/trades';

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app: Express = express();
const PORT = process.env.PORT || 5000;

/**
 * Middleware Configuration
 */
app.use(cors()); // Enable CORS for frontend connections
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

/**
 * Health Check Endpoint
 * Used to verify the server is running
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

/**
 * Root Endpoint
 * Returns basic API information
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Trading Journal API',
    version: '1.0.0',
    status: 'running'
  });
});

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);    // Authentication endpoints (register, login, OAuth)
app.use('/api/trades', tradeRoutes); // Trade management endpoints (CRUD)

/**
 * 404 Handler
 * Catches requests to undefined routes
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

/**
 * Start Server
 */
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Trading Journal API Started');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
});

export default app;
