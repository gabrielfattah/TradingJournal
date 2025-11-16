import type BetterSqlite3 from 'better-sqlite3';

/**
 * Database schema definition
 * All CREATE statements use IF NOT EXISTS for idempotency
 */

export const SCHEMA = {
  /**
   * Users table - stores user accounts
   * - id: Unique identifier (UUID)
   * - username: Unique username for login (optional for OAuth users)
   * - password: Bcrypt hashed password (optional for OAuth users)
   * - email: User email address
   * - google_id: Google's unique user ID (for OAuth)
   * - auth_provider: Authentication method ('local' or 'google')
   * - created_at: Account creation timestamp
   */
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password TEXT,
      email TEXT UNIQUE,
      google_id TEXT UNIQUE,
      auth_provider TEXT DEFAULT 'local',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  /**
   * Trades table - stores trade records
   * - id: Unique identifier (UUID)
   * - user_id: Foreign key to users table
   * - symbol: Stock/crypto symbol (e.g., BTC, ETH)
   * - type: Trade direction (long or short)
   * - entry_price: Price when entering trade
   * - exit_price: Price when exiting trade
   * - size: Quantity traded
   * - date: Trade execution date
   * - notes: Optional trade notes
   * - profit_loss: Calculated P/L amount
   * - profit_loss_percent: Calculated P/L percentage
   * - created_at: Record creation timestamp
   * - updated_at: Record last update timestamp
   */
  trades: `
    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      type TEXT CHECK(type IN ('long', 'short')) NOT NULL,
      entry_price REAL NOT NULL,
      exit_price REAL NOT NULL,
      size REAL NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      profit_loss REAL NOT NULL,
      profit_loss_percent REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,

  /**
   * Indexes for query performance
   * - idx_trades_user_id: Fast lookups by user
   * - idx_trades_date: Fast date-based sorting and filtering
   */
  indexes: [
    'CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_trades_date ON trades(date)',
  ],
};

/**
 * Initialize database with schema
 * Creates all tables and indexes if they don't exist
 * Safe to run multiple times (idempotent)
 *
 * @param db - SQLite database instance
 */
export function initializeDatabase(db: BetterSqlite3.Database): void {
  // Enable foreign key constraints (disabled by default in SQLite)
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(SCHEMA.users);
  db.exec(SCHEMA.trades);

  // Create indexes
  for (const indexSQL of SCHEMA.indexes) {
    db.exec(indexSQL);
  }

  console.log('Database schema initialized successfully');
}
