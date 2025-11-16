import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

/**
 * Extend Express Request to include userId
 * This allows us to access req.userId in our route handlers
 */
export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Middleware to verify JWT token
 * This runs BEFORE route handlers to check if user is authenticated
 */
export function verifyToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Get token from Authorization header
    // Format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    // Extract token (remove "Bearer " prefix)
    // "Bearer xyz123" → "xyz123"
    const token = authHeader.split(' ')[1];

    // Verify token signature and decode payload
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JWTPayload;

    // Attach userId to request object
    // Now all route handlers can access req.userId
    req.userId = decoded.userId;

    // Continue to next middleware/route handler
    next();
  } catch (error) {
    // Token verification failed
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    res.status(500).json({ error: 'Server error' });
    return;
  }
}