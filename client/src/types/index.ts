// User types
export interface User {
  username: string;
  token: string;
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

// Stats types
export interface TradeStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfitLoss: number;
  bestTrade: {
    id: string;
    symbol: string;
    profitLoss: number;
    date: string;
  } | null;
  worstTrade: {
    id: string;
    symbol: string;
    profitLoss: number;
    date: string;
  } | null;
}

// API response types
export interface AuthResponse {
  token: string;
  username: string;
}

export interface ErrorResponse {
  error: string;
}