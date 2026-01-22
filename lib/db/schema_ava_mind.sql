-- AVA Mind Intelligence System - Database Schema
-- Stores trading patterns, learning data, and AI-generated suggestions
-- Enables real-time learning loop and personalized recommendations

-- AVA Mind Trades (detailed trade records with full context)
CREATE TABLE ava_mind_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Trade basics
    symbol VARCHAR(10) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell', 'long', 'short')),
    quantity DECIMAL(12, 4) NOT NULL,
    entry_price DECIMAL(12, 4) NOT NULL,
    exit_price DECIMAL(12, 4),

    -- Outcomes
    outcome VARCHAR(10) CHECK (outcome IN ('WIN', 'LOSS', 'BREAKEVEN', 'OPEN')),
    pnl DECIMAL(12, 4),
    pnl_percent DECIMAL(8, 4),

    -- Timing
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_time TIMESTAMP WITH TIME ZONE,
    hold_duration_minutes INTEGER,
    day_of_week VARCHAR(10),
    hour_of_day INTEGER,

    -- Setup context
    timeframe VARCHAR(10),
    setup_type VARCHAR(50),
    market_condition VARCHAR(20),

    -- Technical indicators at entry
    indicators JSONB DEFAULT '{}',  -- { emaCloud, pivotRibbon, ichimoku, saty, squeeze, etc. }

    -- Risk management
    stop_loss DECIMAL(12, 4),
    take_profit DECIMAL(12, 4),
    risk_reward_ratio DECIMAL(5, 2),

    -- AI predictions at entry
    ai_confidence DECIMAL(5, 2),
    ai_target_price DECIMAL(12, 4),
    unicorn_score INTEGER,

    -- Notes
    notes TEXT,
    tags TEXT[],

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for AVA Mind trades
CREATE INDEX idx_ava_trades_user ON ava_mind_trades(user_id);
CREATE INDEX idx_ava_trades_symbol ON ava_mind_trades(symbol);
CREATE INDEX idx_ava_trades_outcome ON ava_mind_trades(outcome);
CREATE INDEX idx_ava_trades_entry_time ON ava_mind_trades(entry_time DESC);
CREATE INDEX idx_ava_trades_user_entry ON ava_mind_trades(user_id, entry_time DESC);

-- AVA Mind Learning Stats (aggregated user performance)
CREATE TABLE ava_mind_learning (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,

    -- Overall performance
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5, 2) DEFAULT 0,

    -- Profit metrics
    total_pnl DECIMAL(12, 4) DEFAULT 0,
    average_win DECIMAL(8, 4) DEFAULT 0,
    average_loss DECIMAL(8, 4) DEFAULT 0,
    profit_factor DECIMAL(8, 4) DEFAULT 0,

    -- Streaks
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    worst_streak INTEGER DEFAULT 0,

    -- Best dimensions (symbols, days, hours that work best)
    best_symbol VARCHAR(10),
    best_symbol_win_rate DECIMAL(5, 2),
    best_day_of_week VARCHAR(10),
    best_day_win_rate DECIMAL(5, 2),
    best_hour_of_day INTEGER,
    best_hour_win_rate DECIMAL(5, 2),

    -- Risk metrics
    sharpe_ratio DECIMAL(8, 4),
    max_drawdown DECIMAL(8, 4),
    average_hold_minutes INTEGER,

    -- Trading personality
    archetype VARCHAR(50),  -- Conservative, Aggressive, Scalper, Swing Trader, etc.
    emotional_state VARCHAR(20),  -- Confident, Frustrated, Greedy, Neutral
    trust_level INTEGER DEFAULT 1 CHECK (trust_level BETWEEN 1 AND 5),

    -- Metadata
    last_trade_at TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for learning lookups
CREATE UNIQUE INDEX idx_ava_learning_user ON ava_mind_learning(user_id);

-- AVA Mind Patterns (detected trading behavior patterns)
CREATE TABLE ava_mind_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Pattern details
    pattern_type VARCHAR(50) NOT NULL,  -- time_of_day, day_of_week, symbol_correlation, etc.
    dimension VARCHAR(50) NOT NULL,  -- Monday, AAPL, 10am, etc.

    -- Statistics
    trade_count INTEGER DEFAULT 0,
    win_count INTEGER DEFAULT 0,
    loss_count INTEGER DEFAULT 0,
    win_rate DECIMAL(5, 2),
    average_pnl DECIMAL(8, 4),

    -- Confidence
    significance DECIMAL(5, 2),  -- Statistical significance (0-100)
    sample_size_adequate BOOLEAN DEFAULT false,

    -- Discovery
    first_detected TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, pattern_type, dimension)
);

-- Indexes for pattern queries
CREATE INDEX idx_ava_patterns_user ON ava_mind_patterns(user_id);
CREATE INDEX idx_ava_patterns_type ON ava_mind_patterns(pattern_type);
CREATE INDEX idx_ava_patterns_significance ON ava_mind_patterns(significance DESC);

-- AVA Mind Suggestions (AI-generated trade suggestions with outcomes)
CREATE TABLE ava_mind_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Suggestion details
    symbol VARCHAR(10) NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('BUY', 'SELL', 'HOLD', 'CLOSE')),
    confidence DECIMAL(5, 2),
    reasoning TEXT,

    -- Context at suggestion time
    market_context JSONB,  -- { price, indicators, regime, sentiment, etc. }
    personalized_score DECIMAL(5, 2),

    -- Recommendation
    suggested_entry DECIMAL(12, 4),
    suggested_stop DECIMAL(12, 4),
    suggested_target DECIMAL(12, 4),
    suggested_position_size DECIMAL(12, 4),

    -- Outcome tracking
    was_followed BOOLEAN DEFAULT false,
    followed_at TIMESTAMP WITH TIME ZONE,
    outcome VARCHAR(10),  -- WIN, LOSS, IGNORED
    actual_pnl DECIMAL(12, 4),

    -- Accuracy tracking
    prediction_accuracy DECIMAL(5, 2),  -- How close we got to target

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE  -- Suggestions expire after 24 hours
);

-- Indexes for suggestions
CREATE INDEX idx_ava_suggestions_user ON ava_mind_suggestions(user_id);
CREATE INDEX idx_ava_suggestions_symbol ON ava_mind_suggestions(symbol);
CREATE INDEX idx_ava_suggestions_created ON ava_mind_suggestions(created_at DESC);
CREATE INDEX idx_ava_suggestions_followed ON ava_mind_suggestions(was_followed);

-- Trigger for updated_at on AVA Mind tables
CREATE TRIGGER update_ava_trades_updated_at BEFORE UPDATE ON ava_mind_trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ava_learning_updated_at BEFORE UPDATE ON ava_mind_learning
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ava_patterns_updated_at BEFORE UPDATE ON ava_mind_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Materialized view for user trading heatmap (optimization)
CREATE MATERIALIZED VIEW ava_mind_heatmap AS
SELECT
    user_id,
    day_of_week,
    hour_of_day,
    COUNT(*) as trade_count,
    SUM(CASE WHEN outcome = 'WIN' THEN 1 ELSE 0 END) as win_count,
    ROUND(AVG(CASE WHEN outcome = 'WIN' THEN 100 ELSE 0 END), 2) as win_rate,
    ROUND(AVG(pnl_percent), 4) as avg_return
FROM ava_mind_trades
WHERE outcome IN ('WIN', 'LOSS')
GROUP BY user_id, day_of_week, hour_of_day;

-- Create index on materialized view
CREATE INDEX idx_ava_heatmap_user ON ava_mind_heatmap(user_id);

-- Function to refresh materialized view (call periodically)
CREATE OR REPLACE FUNCTION refresh_ava_mind_heatmap()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW ava_mind_heatmap;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE ava_mind_trades IS 'Detailed trade records with full technical context for pattern learning';
COMMENT ON TABLE ava_mind_learning IS 'Aggregated user performance statistics and trading personality';
COMMENT ON TABLE ava_mind_patterns IS 'Detected behavioral patterns in user trading (time, symbols, setups)';
COMMENT ON TABLE ava_mind_suggestions IS 'AI-generated trade suggestions with outcome tracking for accuracy validation';
