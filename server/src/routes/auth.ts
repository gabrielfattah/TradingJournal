import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { getUserByUsername, createUser, getUserByGoogleId, createOAuthUser } from '../models/database';
import { UserRegistration, UserLogin, JWTPayload } from '../types';

const router = Router();

// Initialize Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

/**
 * POST /api/auth/google
 * Verify Google credential and login/register user
 */
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential required' });
    }

    // Verify the credential with Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const googleId = payload.sub;           // Google's unique user ID
    const email = payload.email!;           // User's email
    const name = payload.name || email;     // User's name

    // Find user by Google ID
    let user = getUserByGoogleId(googleId);

    // If not found, create new user
    if (!user) {
      user = createOAuthUser(googleId, email, 'google');
    }

    // Generate JWT token (same as regular login)
    const token = jwt.sign(
      { userId: user.id, username: user.email || user.username },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

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

/**
 * POST /api/auth/google/callback
 * Handle Google OAuth redirect callback (Redirect mode)
 */
router.post('/google/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: 'http://localhost:5173/auth/callback',
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      throw new Error('Failed to exchange authorization code');
    }

    const tokens = await tokenResponse.json();

    // Verify the ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const googleId = payload.sub;
    const email = payload.email!;

    // Find or create user
    let user = getUserByGoogleId(googleId);

    if (!user) {
      user = createOAuthUser(googleId, email, 'google');
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.email || user.username },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      username: user.email || user.username
    });

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

export default router;