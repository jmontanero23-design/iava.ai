-- iAVA.AI PostgreSQL Schema
-- PhD Elite+++ Quality Database Design
-- Using Neon PostgreSQL

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (replacing localStorage auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_pro BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    alpaca_key_encrypted TEXT,
    alpaca_secret_encrypted TEXT,
    alpaca_is_paper BOOLEAN DEFAULT true
);

-- Create index for email lookups
CREATE INDEX idx_users_email ON users(email);

-- Sessions table (for JWT/Redis hybrid)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for token lookups
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- Trades table (real trade history)
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
    quantity DECIMAL(12, 4) NOT NULL,
    price DECIMAL(12, 4) NOT NULL,
    order_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    alpaca_order_id VARCHAR(100),
    filled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    stop_loss DECIMAL(12, 4),
    take_profit DECIMAL(12, 4),
    notes TEXT,
    tags TEXT[],
    pnl DECIMAL(12, 4),
    pnl_percent DECIMAL(8, 4)
);

-- Create indexes for trade queries
CREATE INDEX idx_trades_user ON trades(user_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_created ON trades(created_at DESC);

-- Watchlists table
CREATE TABLE watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    symbols TEXT[] NOT NULL DEFAULT '{}',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint for one default watchlist per user
CREATE UNIQUE INDEX idx_watchlist_default ON watchlists(user_id) WHERE is_default = true;

-- AI Insights table (storing AI analysis results)
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(10),
    insight_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    confidence DECIMAL(5, 2),
    model_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for AI insights
CREATE INDEX idx_ai_insights_user ON ai_insights(user_id);
CREATE INDEX idx_ai_insights_symbol ON ai_insights(symbol);
CREATE INDEX idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX idx_ai_insights_created ON ai_insights(created_at DESC);

-- Signal Quality Scores table
CREATE TABLE signal_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    score DECIMAL(5, 2) NOT NULL,
    components JSONB NOT NULL,
    regime VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for signal scores
CREATE INDEX idx_signal_scores_user_symbol ON signal_scores(user_id, symbol);
CREATE INDEX idx_signal_scores_created ON signal_scores(created_at DESC);

-- Market Regimes table (caching regime detection)
CREATE TABLE market_regimes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(10) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    regime VARCHAR(50) NOT NULL,
    confidence DECIMAL(5, 2),
    indicators JSONB,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE
);

-- Create index for regime lookups
CREATE UNIQUE INDEX idx_regimes_symbol_tf ON market_regimes(symbol, timeframe);

-- Pattern Detections table
CREATE TABLE pattern_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(10) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    pattern_type VARCHAR(50) NOT NULL,
    pattern_name VARCHAR(100) NOT NULL,
    confidence DECIMAL(5, 2),
    coordinates JSONB,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE
);

-- Create index for pattern lookups
CREATE INDEX idx_patterns_symbol ON pattern_detections(symbol);
CREATE INDEX idx_patterns_detected ON pattern_detections(detected_at DESC);

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    condition JSONB NOT NULL,
    target_value DECIMAL(12, 4),
    is_active BOOLEAN DEFAULT true,
    triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for alerts
CREATE INDEX idx_alerts_user ON alerts(user_id);
CREATE INDEX idx_alerts_active ON alerts(is_active) WHERE is_active = true;

-- Trade Journal Entries
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    entry_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    sentiment VARCHAR(20),
    tags TEXT[],
    ai_analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for journal
CREATE INDEX idx_journal_user ON journal_entries(user_id);
CREATE INDEX idx_journal_trade ON journal_entries(trade_id);
CREATE INDEX idx_journal_created ON journal_entries(created_at DESC);

-- Audit Log table (for compliance and debugging)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for audit logs
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- Functions for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watchlists_updated_at BEFORE UPDATE ON watchlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Performance tuning indexes
CREATE INDEX idx_trades_user_created ON trades(user_id, created_at DESC);
CREATE INDEX idx_ai_insights_user_created ON ai_insights(user_id, created_at DESC);
CREATE INDEX idx_sessions_expires ON sessions(expires_at) WHERE expires_at > NOW();

-- Create view for active sessions
CREATE VIEW active_sessions AS
SELECT s.*, u.email, u.name
FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.expires_at > NOW();

-- Create view for recent trades with P&L
CREATE VIEW recent_trades_with_pnl AS
SELECT
    t.*,
    u.email as user_email,
    u.name as user_name,
    CASE
        WHEN t.pnl IS NOT NULL THEN t.pnl
        ELSE 0
    END as calculated_pnl
FROM trades t
JOIN users u ON t.user_id = u.id
WHERE t.created_at > NOW() - INTERVAL '30 days'
ORDER BY t.created_at DESC;

-- Initial admin user (change password immediately!)
-- Password: 'changeme123' (bcrypt hash)
INSERT INTO users (email, password_hash, name, is_verified, is_pro)
VALUES (
    'admin@iava.ai',
    '$2a$10$zJPjXM.YtRZ0eMDhJp5vNe5P3YhPvPpR5qKqP5BHjJWxK5DGJD3LK',
    'Admin',
    true,
    true
) ON CONFLICT (email) DO NOTHING;