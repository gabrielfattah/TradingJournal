import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getUserByUsername, createUser } from '../models/database';
import { UserRegistration, UserLogin, JWTPayload } from '../types';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password }: UserRegistration = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password (never store plain text!)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    const newUser = createUser(username, hashedPassword);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username } as JWTPayload,
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    // Return token (don't send password back!)
    res.status(201).json({ token, username: newUser.username });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/auth/login
 * Login an existing user
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password }: UserLogin = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user
    const user = getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username } as JWTPayload,
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.json({ token, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;