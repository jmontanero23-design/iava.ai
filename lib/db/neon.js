/**
 * Neon PostgreSQL Database Connection
 * PhD Elite+++ Quality Database Layer
 *
 * Using @neondatabase/serverless for edge runtime compatibility
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Configure Neon for Vercel Edge Functions
neonConfig.fetchConnectionCache = true;

// Initialize Neon connection (using iava_ prefix from Vercel)
const sql = neon(process.env.iava_DATABASE_URL || process.env.iava_POSTGRES_URL || process.env.DATABASE_URL);

// Initialize Drizzle ORM for type-safe queries
export const db = drizzle(sql);

/**
 * Execute raw SQL query
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
export async function query(queryText, params = []) {
  try {
    const result = await sql(queryText, params);
    return result;
  } catch (error) {
    console.error('[Neon] Query error:', error);
    throw error;
  }
}

/**
 * Transaction helper
 * @param {Function} callback - Transaction callback
 */
export async function transaction(callback) {
  try {
    await sql('BEGIN');
    const result = await callback(sql);
    await sql('COMMIT');
    return result;
  } catch (error) {
    await sql('ROLLBACK');
    throw error;
  }
}

// User operations
export const users = {
  /**
   * Create new user
   */
  async create({ email, passwordHash, name }) {
    const result = await sql`
      INSERT INTO users (email, password_hash, name)
      VALUES (${email}, ${passwordHash}, ${name})
      RETURNING id, email, name, created_at
    `;
    return result[0];
  },

  /**
   * Find user by email
   */
  async findByEmail(email) {
    const result = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;
    return result[0];
  },

  /**
   * Find user by ID
   */
  async findById(id) {
    const result = await sql`
      SELECT * FROM users WHERE id = ${id}
    `;
    return result[0];
  },

  /**
   * Update user settings
   */
  async updateSettings(userId, settings) {
    const result = await sql`
      UPDATE users
      SET settings = settings || ${JSON.stringify(settings)}::jsonb
      WHERE id = ${userId}
      RETURNING *
    `;
    return result[0];
  },

  /**
   * Update Alpaca credentials (encrypted)
   */
  async updateAlpacaCredentials(userId, encryptedKey, encryptedSecret, isPaper) {
    const result = await sql`
      UPDATE users
      SET
        alpaca_key_encrypted = ${encryptedKey},
        alpaca_secret_encrypted = ${encryptedSecret},
        alpaca_is_paper = ${isPaper}
      WHERE id = ${userId}
      RETURNING id
    `;
    return result[0];
  }
};

// Session operations
export const sessions = {
  /**
   * Create new session
   */
  async create({ userId, tokenHash, ipAddress, userAgent, expiresAt }) {
    const result = await sql`
      INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, expires_at)
      VALUES (${userId}, ${tokenHash}, ${ipAddress}, ${userAgent}, ${expiresAt})
      RETURNING id, user_id, expires_at
    `;
    return result[0];
  },

  /**
   * Find session by token hash
   */
  async findByTokenHash(tokenHash) {
    const result = await sql`
      SELECT s.*, u.email, u.name, u.settings
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token_hash = ${tokenHash} AND s.expires_at > NOW()
    `;
    return result[0];
  },

  /**
   * Delete expired sessions
   */
  async cleanupExpired() {
    const result = await sql`
      DELETE FROM sessions WHERE expires_at < NOW()
    `;
    return result.count;
  }
};

// Trade operations
export const trades = {
  /**
   * Record new trade
   */
  async create(trade) {
    const result = await sql`
      INSERT INTO trades (
        user_id, symbol, side, quantity, price, order_type,
        status, alpaca_order_id, stop_loss, take_profit, notes, tags
      )
      VALUES (
        ${trade.userId}, ${trade.symbol}, ${trade.side}, ${trade.quantity},
        ${trade.price}, ${trade.orderType}, ${trade.status}, ${trade.alpacaOrderId},
        ${trade.stopLoss}, ${trade.takeProfit}, ${trade.notes}, ${trade.tags}
      )
      RETURNING *
    `;
    return result[0];
  },

  /**
   * Get user's trades
   */
  async findByUser(userId, limit = 100) {
    const result = await sql`
      SELECT * FROM trades
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return result;
  },

  /**
   * Update trade status
   */
  async updateStatus(tradeId, status, filledAt = null) {
    const result = await sql`
      UPDATE trades
      SET status = ${status}, filled_at = ${filledAt}
      WHERE id = ${tradeId}
      RETURNING *
    `;
    return result[0];
  },

  /**
   * Calculate P&L for closed trade
   */
  async updatePnL(tradeId, pnl, pnlPercent) {
    const result = await sql`
      UPDATE trades
      SET pnl = ${pnl}, pnl_percent = ${pnlPercent}
      WHERE id = ${tradeId}
      RETURNING *
    `;
    return result[0];
  }
};

// Watchlist operations
export const watchlists = {
  /**
   * Create watchlist
   */
  async create({ userId, name, symbols = [] }) {
    const result = await sql`
      INSERT INTO watchlists (user_id, name, symbols)
      VALUES (${userId}, ${name}, ${symbols})
      RETURNING *
    `;
    return result[0];
  },

  /**
   * Get user's watchlists
   */
  async findByUser(userId) {
    const result = await sql`
      SELECT * FROM watchlists
      WHERE user_id = ${userId}
      ORDER BY is_default DESC, created_at DESC
    `;
    return result;
  },

  /**
   * Update watchlist symbols
   */
  async updateSymbols(watchlistId, symbols) {
    const result = await sql`
      UPDATE watchlists
      SET symbols = ${symbols}
      WHERE id = ${watchlistId}
      RETURNING *
    `;
    return result[0];
  },

  /**
   * Set default watchlist
   */
  async setDefault(userId, watchlistId) {
    // First, unset all defaults
    await sql`
      UPDATE watchlists
      SET is_default = false
      WHERE user_id = ${userId}
    `;

    // Then set the new default
    const result = await sql`
      UPDATE watchlists
      SET is_default = true
      WHERE id = ${watchlistId} AND user_id = ${userId}
      RETURNING *
    `;
    return result[0];
  }
};

// AI Insights operations
export const aiInsights = {
  /**
   * Store AI insight
   */
  async create({ userId, symbol, insightType, content, confidence, modelVersion }) {
    const result = await sql`
      INSERT INTO ai_insights (
        user_id, symbol, insight_type, content, confidence, model_version
      )
      VALUES (
        ${userId}, ${symbol}, ${insightType}, ${JSON.stringify(content)},
        ${confidence}, ${modelVersion}
      )
      RETURNING *
    `;
    return result[0];
  },

  /**
   * Get recent insights for user
   */
  async findRecent(userId, limit = 10) {
    const result = await sql`
      SELECT * FROM ai_insights
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return result;
  },

  /**
   * Get insights for symbol
   */
  async findBySymbol(symbol, limit = 5) {
    const result = await sql`
      SELECT * FROM ai_insights
      WHERE symbol = ${symbol}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return result;
  }
};

// Signal Score operations
export const signalScores = {
  /**
   * Store signal score
   */
  async create({ userId, symbol, timeframe, score, components, regime }) {
    const result = await sql`
      INSERT INTO signal_scores (
        user_id, symbol, timeframe, score, components, regime
      )
      VALUES (
        ${userId}, ${symbol}, ${timeframe}, ${score},
        ${JSON.stringify(components)}, ${regime}
      )
      RETURNING *
    `;
    return result[0];
  },

  /**
   * Get recent scores for symbol
   */
  async findBySymbol(userId, symbol, limit = 10) {
    const result = await sql`
      SELECT * FROM signal_scores
      WHERE user_id = ${userId} AND symbol = ${symbol}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return result;
  }
};

// Market Regime operations
export const marketRegimes = {
  /**
   * Store/update regime detection
   */
  async upsert({ symbol, timeframe, regime, confidence, indicators, validUntil }) {
    const result = await sql`
      INSERT INTO market_regimes (
        symbol, timeframe, regime, confidence, indicators, valid_until
      )
      VALUES (
        ${symbol}, ${timeframe}, ${regime}, ${confidence},
        ${JSON.stringify(indicators)}, ${validUntil}
      )
      ON CONFLICT (symbol, timeframe)
      DO UPDATE SET
        regime = EXCLUDED.regime,
        confidence = EXCLUDED.confidence,
        indicators = EXCLUDED.indicators,
        detected_at = NOW(),
        valid_until = EXCLUDED.valid_until
      RETURNING *
    `;
    return result[0];
  },

  /**
   * Get current regime for symbol
   */
  async getCurrent(symbol, timeframe) {
    const result = await sql`
      SELECT * FROM market_regimes
      WHERE symbol = ${symbol} AND timeframe = ${timeframe}
        AND valid_until > NOW()
    `;
    return result[0];
  }
};

// Initialize database schema (run once)
export async function initializeDatabase() {
  try {
    // Check if tables exist
    const tablesExist = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      )
    `;

    if (!tablesExist[0].exists) {
      // Run schema.sql
      const fs = await import('fs');
      const path = await import('path');
      const schemaSQL = fs.readFileSync(
        path.join(process.cwd(), 'lib/db/schema.sql'),
        'utf8'
      );

      // Execute schema
      await sql(schemaSQL);
      return { success: true, message: 'Database initialized' };
    }

    return { success: true, message: 'Database already initialized' };
  } catch (error) {
    console.error('[Neon] Database initialization error:', error);
    return { success: false, error: error.message };
  }
}

// Export connection for raw queries
export default sql;