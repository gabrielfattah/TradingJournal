/**
 * Authentication Routes
 * Handles user registration, login, and Google OAuth authentication
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { getUserByUsername, createUser, getUserByGoogleId, createOAuthUser } from '../models/database';
import { UserRegistration, UserLogin, JWTPayload } from '../types';

const router = Router();

// Constants
const BCRYPT_ROUNDS = 10;
const JWT_EXPIRY = '7d';
const MIN_PASSWORD_LENGTH = 6;

// Google OAuth client initialization
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Helper: Generate JWT token for authenticated user
 */
function generateAuthToken(userId: string, username: string): string {
  const payload: JWTPayload = { userId, username };
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: JWT_EXPIRY
  });
}

/**
 * POST /api/auth/register
 * Register a new user with username and password
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password }: UserRegistration = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Validate password length
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      });
    }

    // Check if username already exists
    const existingUser = getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Hash password before storing (never store plain text!)
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create new user in database
    const newUser = createUser(username, hashedPassword);

    // Generate JWT authentication token
    const token = generateAuthToken(newUser.id, newUser.username!);

    // Return token and username
    res.status(201).json({
      token,
      username: newUser.username
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate existing user with username and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password }: UserLogin = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user by username
    const user = getUserByUsername(username);
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT authentication token
    const token = generateAuthToken(user.id, user.username!);

    // Return token and username
    res.json({
      token,
      username: user.username
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/auth/google
 * Authenticate with Google OAuth (Popup mode)
 * Verifies Google ID token and creates/logs in user
 */
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    // Validate credential presence
    if (!credential) {
      return res.status(400).json({ error: 'Google credential required' });
    }

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    // Extract user information from Google payload
    const googleId = payload.sub;
    const email = payload.email!;

    // Find existing user or create new one
    let user = getUserByGoogleId(googleId);
    if (!user) {
      user = createOAuthUser(googleId, email, 'google');
    }

    // Generate JWT authentication token
    const token = generateAuthToken(user.id, user.email || user.username!);

    // Return token and username
    res.json({
      token,
      username: user.email || user.username
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(401).json({ error: 'Invalid Google credentials' });
  }
});

export default router;
