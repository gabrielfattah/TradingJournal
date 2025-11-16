/**
 * Trade Routes
 * Handles CRUD operations for trading journal entries
 */

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

// Apply authentication middleware to all routes
// All routes below require a valid JWT token
router.use(verifyToken);

/**
 * Helper: Calculate profit/loss for a trade
 *
 * @param type - Trade type ('long' or 'short')
 * @param entryPrice - Price when trade was opened
 * @param exitPrice - Price when trade was closed
 * @param size - Number of units traded
 * @returns Object containing profit/loss amount and percentage
 */
function calculateProfitLoss(
  type: 'long' | 'short',
  entryPrice: number,
  exitPrice: number,
  size: number
): { profitLoss: number; profitLossPercent: number } {
  let profitLoss: number;

  if (type === 'long') {
    // Long position: profit when price increases
    profitLoss = (exitPrice - entryPrice) * size;
  } else {
    // Short position: profit when price decreases
    profitLoss = (entryPrice - exitPrice) * size;
  }

  // Calculate percentage relative to initial investment
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
    const userId = req.userId!;
    const trades = getAllTradesByUserId(userId);
    res.json(trades);
  } catch (error) {
    console.error('Get trades error:', error);
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
    const stats = getTradeStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /api/trades
 * Create a new trade entry
 */
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { symbol, type, entryPrice, exitPrice, size, date, notes }: TradeInput = req.body;

    // Validate required fields
    if (!symbol || !type || entryPrice === undefined || exitPrice === undefined || !size || !date) {
      return res.status(400).json({
        error: 'Missing required fields: symbol, type, entryPrice, exitPrice, size, date'
      });
    }

    // Validate trade type
    if (type !== 'long' && type !== 'short') {
      return res.status(400).json({ error: 'Type must be "long" or "short"' });
    }

    // Validate numerical values
    if (entryPrice <= 0 || exitPrice <= 0 || size <= 0) {
      return res.status(400).json({ error: 'Prices and size must be positive numbers' });
    }

    // Calculate profit/loss metrics
    const { profitLoss, profitLossPercent } = calculateProfitLoss(
      type,
      entryPrice,
      exitPrice,
      size
    );

    // Create trade in database
    const newTrade = createTrade(
      userId,
      symbol.toUpperCase(), // Standardize symbol to uppercase
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
 * PUT /api/trades/:id
 * Update an existing trade
 */
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const tradeId = req.params.id;
    const updates: Partial<TradeInput> = req.body;

    // Validate trade type if being updated
    if (updates.type && updates.type !== 'long' && updates.type !== 'short') {
      return res.status(400).json({ error: 'Type must be "long" or "short"' });
    }

    // Validate numerical values if being updated
    if (updates.entryPrice !== undefined && updates.entryPrice <= 0) {
      return res.status(400).json({ error: 'Entry price must be positive' });
    }
    if (updates.exitPrice !== undefined && updates.exitPrice <= 0) {
      return res.status(400).json({ error: 'Exit price must be positive' });
    }
    if (updates.size !== undefined && updates.size <= 0) {
      return res.status(400).json({ error: 'Size must be positive' });
    }

    // Get existing trade to merge with updates
    const existingTrade = getAllTradesByUserId(userId).find(t => t.id === tradeId);
    if (!existingTrade) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    // Merge updates with existing values
    const symbol = updates.symbol ? updates.symbol.toUpperCase() : existingTrade.symbol;
    const type = updates.type || existingTrade.type;
    const entryPrice = updates.entryPrice !== undefined ? updates.entryPrice : existingTrade.entryPrice;
    const exitPrice = updates.exitPrice !== undefined ? updates.exitPrice : existingTrade.exitPrice;
    const size = updates.size !== undefined ? updates.size : existingTrade.size;
    const date = updates.date || existingTrade.date;
    const notes = updates.notes !== undefined ? updates.notes : existingTrade.notes || '';

    // Recalculate profit/loss with new values
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
      return res.status(404).json({ error: 'Trade not found' });
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

    const deleted = deleteTrade(tradeId, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Trade not found' });
    }

    res.json({ message: 'Trade deleted successfully' });
  } catch (error) {
    console.error('Delete trade error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
