import Database from 'better-sqlite3';
import path from 'path';
import { randomUUID } from 'crypto';
import { initializeDatabase } from './schema';
import type { User, Trade } from '../types';

/**
 * Internal database types (snake_case to match SQLite columns)
 */
interface DBUser {
  id: string;
  username: string;
  password: string;
  created_at: string;
}

interface DBTrade {
  id: string;
  user_id: string;
  symbol: string;
  type: 'long' | 'short';
  entry_price: number;
  exit_price: number;
  size: number;
  date: string;
  notes?: string;
  profit_loss: number;
  profit_loss_percent: number;
  created_at: string;
  updated_at: string;
}

/**
 * Mapper functions to convert between snake_case (DB) and camelCase (API)
 */
function mapDBUserToUser(dbUser: DBUser): User {
  return {
    id: dbUser.id,
    username: dbUser.username,
    password: dbUser.password,
    createdAt: dbUser.created_at,
  };
}

function mapDBTradeToTrade(dbTrade: DBTrade): Trade {
  return {
    id: dbTrade.id,
    userId: dbTrade.user_id,
    symbol: dbTrade.symbol,
    type: dbTrade.type,
    entryPrice: dbTrade.entry_price,
    exitPrice: dbTrade.exit_price,
    size: dbTrade.size,
    date: dbTrade.date,
    notes: dbTrade.notes,
    profitLoss: dbTrade.profit_loss,
    profitLossPercent: dbTrade.profit_loss_percent,
    createdAt: dbTrade.created_at,
    updatedAt: dbTrade.updated_at,
  };
}

/**
 * SQLite Database Connection
 * Single instance shared across the application
 */
const DB_PATH = path.join(__dirname, '../data/trades.db');
export const db = new Database(DB_PATH);

// Initialize database schema (creates tables and indexes)
initializeDatabase(db);

/**
 * Generate a unique ID using UUID v4
 * Cryptographically secure and guaranteed unique
 */
export function generateId(): string {
  return randomUUID();
}

// ==================== USER OPERATIONS ====================

/**
 * Get user by username
 * Used for login and duplicate username checks
 */
export function getUserByUsername(username: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const dbUser = stmt.get(username) as DBUser | undefined;
  return dbUser ? mapDBUserToUser(dbUser) : undefined;
}

/**
 * Get user by ID
 * Used for authentication verification
 */
export function getUserById(id: string): User | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  const dbUser = stmt.get(id) as DBUser | undefined;
  return dbUser ? mapDBUserToUser(dbUser) : undefined;
}

/**
 * Create a new user
 * Returns the created user
 */
export function createUser(username: string, hashedPassword: string): User {
  const id = generateId();
  const stmt = db.prepare(`
    INSERT INTO users (id, username, password)
    VALUES (?, ?, ?)
  `);

  stmt.run(id, username, hashedPassword);

  return getUserById(id)!;
}

// ==================== TRADE OPERATIONS ====================

/**
 * Get all trades for a specific user
 * Returns trades sorted by date (newest first)
 */
export function getAllTradesByUserId(userId: string): Trade[] {
  const stmt = db.prepare(`
    SELECT * FROM trades
    WHERE user_id = ?
    ORDER BY date DESC
  `);

  const dbTrades = stmt.all(userId) as DBTrade[];
  return dbTrades.map(mapDBTradeToTrade);
}

/**
 * Get a specific trade by ID (user must own it)
 * Returns undefined if not found or doesn't belong to user
 */
export function getTradeById(id: string, userId: string): Trade | undefined {
  const stmt = db.prepare(`
    SELECT * FROM trades
    WHERE id = ? AND user_id = ?
  `);

  const dbTrade = stmt.get(id, userId) as DBTrade | undefined;
  return dbTrade ? mapDBTradeToTrade(dbTrade) : undefined;
}

/**
 * Create a new trade
 * Returns the created trade
 */
export function createTrade(
  userId: string,
  symbol: string,
  type: 'long' | 'short',
  entryPrice: number,
  exitPrice: number,
  size: number,
  date: string,
  notes: string,
  profitLoss: number,
  profitLossPercent: number
): Trade {
  const id = generateId();

  const stmt = db.prepare(`
    INSERT INTO trades (
      id, user_id, symbol, type, entry_price, exit_price,
      size, date, notes, profit_loss, profit_loss_percent
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    userId,
    symbol,
    type,
    entryPrice,
    exitPrice,
    size,
    date,
    notes,
    profitLoss,
    profitLossPercent
  );

  return getTradeById(id, userId)!;
}

/**
 * Update an existing trade
 * Returns the updated trade or undefined if not found
 */
export function updateTrade(
  id: string,
  userId: string,
  symbol: string,
  type: 'long' | 'short',
  entryPrice: number,
  exitPrice: number,
  size: number,
  date: string,
  notes: string,
  profitLoss: number,
  profitLossPercent: number
): Trade | undefined {
  const stmt = db.prepare(`
    UPDATE trades
    SET symbol = ?,
        type = ?,
        entry_price = ?,
        exit_price = ?,
        size = ?,
        date = ?,
        notes = ?,
        profit_loss = ?,
        profit_loss_percent = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `);

  const result = stmt.run(
    symbol,
    type,
    entryPrice,
    exitPrice,
    size,
    date,
    notes,
    profitLoss,
    profitLossPercent,
    id,
    userId
  );

  if (result.changes === 0) {
    return undefined;
  }

  return getTradeById(id, userId);
}

/**
 * Delete a trade
 * Returns true if deleted, false if not found
 */
export function deleteTrade(id: string, userId: string): boolean {
  const stmt = db.prepare(`
    DELETE FROM trades
    WHERE id = ? AND user_id = ?
  `);

  const result = stmt.run(id, userId);
  return result.changes > 0;
}

/**
 * Get trade statistics for a user
 */
export function getTradeStats(userId: string) {
  const trades = getAllTradesByUserId(userId);

  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalProfitLoss: 0,
      bestTrade: null,
      worstTrade: null,
    };
  }

  const winningTrades = trades.filter(t => t.profitLoss > 0);
  const losingTrades = trades.filter(t => t.profitLoss < 0);
  const totalProfitLoss = trades.reduce((sum, t) => sum + t.profitLoss, 0);
  const winRate = (winningTrades.length / trades.length) * 100;

  const bestTrade = trades.reduce((best, current) =>
    current.profitLoss > best.profitLoss ? current : best
  );

  const worstTrade = trades.reduce((worst, current) =>
    current.profitLoss < worst.profitLoss ? current : worst
  );

  return {
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: Number(winRate.toFixed(2)),
    totalProfitLoss: Number(totalProfitLoss.toFixed(2)),
    bestTrade: {
      id: bestTrade.id,
      symbol: bestTrade.symbol,
      profitLoss: bestTrade.profitLoss,
      date: bestTrade.date,
    },
    worstTrade: {
      id: worstTrade.id,
      symbol: worstTrade.symbol,
      profitLoss: worstTrade.profitLoss,
      date: worstTrade.date,
    },
  };
}

/**
 * Close database connection
 * Call this on server shutdown
 */
export function closeDatabase(): void {
  db.close();
}
