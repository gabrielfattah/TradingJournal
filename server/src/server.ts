import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authroutes from './routes/auth'; 
import tradeRoutes from './routes/trades';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allow frontend to connect
app.use(express.json()); // Parse JSON request bodies

// Test route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Trading Journal API is running!' });
});

// - Authentication routes (register, login)
app.use('/api/auth', authroutes);

// - Trade routes (CRUD operations)
app.use('/api/trades', tradeRoutes)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

export default app;
