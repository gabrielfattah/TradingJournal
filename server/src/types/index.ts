// User types
export interface User {
  id: string;
  username: string;
  password: string; // hashed password
  email?: string;
  googleId?: string;
  authProvider?: string;
  createdAt: string;
}

export interface UserRegistration {
  username: string;
  password: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

// Trade types
export interface Trade {
  id: string;
  userId: string;
  symbol: string;
  type: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  size: number;
  date: string;
  notes?: string;
  profitLoss: number;
  profitLossPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface TradeInput {
  symbol: string;
  type: 'long' | 'short';
  entryPrice: number;
  exitPrice: number;
  size: number;
  date: string;
  notes?: string;
}

// Database structure
export interface Database {
  users: User[];
  trades: Trade[];
}

// JWT payload
export interface JWTPayload {
  userId: string;
  username: string;
}

// Express Request extension
export interface AuthRequest extends Request {
  userId?: string;
}
