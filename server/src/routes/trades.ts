import { Router, Response } from 'express';
import { verifyToken, AuthRequest } from '../middleware/verifyToken';
import {
  getAllTradesByUserId,
  createTrade,
  updateTrade,
  deleteTrade,
  getTradeStats,
} from '../models/database';
import { TradeInput } from '../types';

const router = Router();

// Apply authentication middleware to ALL routes in this file
// Every route below will require a valid JWT token
router.use(verifyToken);

/**
 * Helper function to calculate profit/loss
 */
function calculateProfitLoss(
  type: 'long' | 'short',
  entryPrice: number,
  exitPrice: number,
  size: number
): { profitLoss: number; profitLossPercent: number } {
  let profitLoss: number;
  
  if (type === 'long') {
    // Long: profit when price goes up
    profitLoss = (exitPrice - entryPrice) * size;
  } else {
    // Short: profit when price goes down
    profitLoss = (entryPrice - exitPrice) * size;
  }
  
  // Calculate percentage
  const profitLossPercent = (profitLoss / (entryPrice * size)) * 100;

  return {
    profitLoss: Number(profitLoss.toFixed(2)),
    profitLossPercent: Number(profitLossPercent.toFixed(2)),
  };
}

/**
 * GET /api/trades
 * Get all trades for the authenticated user
 */
router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!; // We know it exists because verifyToken ran

    // Get all trades for this user from SQLite
    const userTrades = getAllTradesByUserId(userId);

    res.json(userTrades);
  } catch (error) {
    console.error('Get trades error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/trades
 * Create a new trade
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { symbol, type, entryPrice, exitPrice, size, date, notes }: TradeInput = req.body;

    // Validate required fields
    if (!symbol || !type || !entryPrice || !exitPrice || !size || !date) {
      res.status(400).json({ error: 'Missing required fields: symbol, type, entryPrice, exitPrice, size, date' });
      return;
    }

    // Validate type
    if (type !== 'long' && type !== 'short') {
      res.status(400).json({ error: 'Type must be "long" or "short"' });
      return;
    }

    // Validate numbers
    if (entryPrice <= 0 || exitPrice <= 0 || size <= 0) {
      res.status(400).json({ error: 'Prices and size must be positive numbers' });
      return;
    }

    // Calculate profit/loss
    const { profitLoss, profitLossPercent } = calculateProfitLoss(
      type,
      entryPrice,
      exitPrice,
      size
    );

    // Create trade in database
    const newTrade = createTrade(
      userId,
      symbol.toUpperCase(), // Standardize to uppercase
      type,
      entryPrice,
      exitPrice,
      size,
      date,
      notes || '',
      profitLoss,
      profitLossPercent
    );

    res.status(201).json(newTrade);
  } catch (error) {
    console.error('Create trade error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/trades/stats
 * Get trading statistics for the authenticated user
 */
router.get('/stats', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Get statistics from database
    const stats = getTradeStats(userId);

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PUT /api/trades/:id
 * Update an existing trade
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const tradeId = req.params.id;
    const updates: Partial<TradeInput> = req.body;

    // Validate if type is being updated
    if (updates.type && updates.type !== 'long' && updates.type !== 'short') {
      res.status(400).json({ error: 'Type must be "long" or "short"' });
      return;
    }

    // Validate numbers if being updated
    if (updates.entryPrice && updates.entryPrice <= 0) {
      res.status(400).json({ error: 'Entry price must be positive' });
      return;
    }
    if (updates.exitPrice && updates.exitPrice <= 0) {
      res.status(400).json({ error: 'Exit price must be positive' });
      return;
    }
    if (updates.size && updates.size <= 0) {
      res.status(400).json({ error: 'Size must be positive' });
      return;
    }

    // For SQLite update, we need all values not just updates
    // Get existing trade first to merge values
    const existingTrade = getAllTradesByUserId(userId).find(t => t.id === tradeId);

    if (!existingTrade) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }

    // Merge updates with existing values
    const symbol = updates.symbol ? updates.symbol.toUpperCase() : existingTrade.symbol;
    const type = updates.type || existingTrade.type;
    const entryPrice = updates.entryPrice !== undefined ? updates.entryPrice : existingTrade.entryPrice;
    const exitPrice = updates.exitPrice !== undefined ? updates.exitPrice : existingTrade.exitPrice;
    const size = updates.size !== undefined ? updates.size : existingTrade.size;
    const date = updates.date || existingTrade.date;
    const notes = updates.notes !== undefined ? updates.notes : existingTrade.notes || '';

    // Recalculate P/L
    const { profitLoss, profitLossPercent } = calculateProfitLoss(
      type,
      entryPrice,
      exitPrice,
      size
    );

    // Update trade in database
    const updatedTrade = updateTrade(
      tradeId,
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

    if (!updatedTrade) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }

    res.json(updatedTrade);
  } catch (error) {
    console.error('Update trade error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * DELETE /api/trades/:id
 * Delete a trade
 */
router.delete('/:id', (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const tradeId = req.params.id;

    // Delete trade from database
    const deleted = deleteTrade(tradeId, userId);

    if (!deleted) {
      res.status(404).json({ error: 'Trade not found' });
      return;
    }

    res.json({ message: 'Trade deleted successfully' });
  } catch (error) {
    console.error('Delete trade error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;