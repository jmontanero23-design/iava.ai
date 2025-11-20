/**
 * Create Remaining 7 Tables (to get to 12 total)
 */

import dotenv from 'dotenv';
dotenv.config();

import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.iava_DATABASE_URL;
const sql = neon(databaseUrl);

async function createRemainingTables() {
  console.log('📊 Creating remaining 7 tables...\n');

  try {
    // 6. Portfolios
    console.log('6. Creating portfolios table...');
    await sql`
      CREATE TABLE IF NOT EXISTS portfolios (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        holdings JSONB DEFAULT '[]',
        total_value NUMERIC(15,2),
        cash_balance NUMERIC(15,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ Portfolios created');

    // 7. Alerts
    console.log('7. Creating alerts table...');
    await sql`
      CREATE TABLE IF NOT EXISTS alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR(10) NOT NULL,
        alert_type VARCHAR(50) NOT NULL,
        condition_type VARCHAR(20) NOT NULL,
        target_value NUMERIC,
        message TEXT,
        is_triggered BOOLEAN DEFAULT false,
        triggered_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE
      )
    `;
    console.log('✅ Alerts created');

    // 8. Market Data Cache
    console.log('8. Creating market_data table...');
    await sql`
      CREATE TABLE IF NOT EXISTS market_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        symbol VARCHAR(10) NOT NULL,
        timeframe VARCHAR(10) NOT NULL,
        data JSONB NOT NULL,
        cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        UNIQUE(symbol, timeframe)
      )
    `;
    console.log('✅ Market data created');

    // 9. Strategy Templates
    console.log('9. Creating strategy_templates table...');
    await sql`
      CREATE TABLE IF NOT EXISTS strategy_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        config JSONB NOT NULL,
        is_public BOOLEAN DEFAULT false,
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ Strategy templates created');

    // 10. Backtest Results
    console.log('10. Creating backtest_results table...');
    await sql`
      CREATE TABLE IF NOT EXISTS backtest_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        strategy_id UUID REFERENCES strategy_templates(id) ON DELETE SET NULL,
        symbol VARCHAR(10) NOT NULL,
        timeframe VARCHAR(10) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        results JSONB NOT NULL,
        total_return NUMERIC(10,4),
        sharpe_ratio NUMERIC(10,4),
        max_drawdown NUMERIC(10,4),
        win_rate NUMERIC(5,4),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ Backtest results created');

    // 11. User Settings (extended settings beyond users table)
    console.log('11. Creating user_settings table...');
    await sql`
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        notifications JSONB DEFAULT '{"email": true, "push": false, "sms": false}',
        display_preferences JSONB DEFAULT '{"theme": "dark", "chart_type": "candlestick"}',
        trading_preferences JSONB DEFAULT '{"default_order_type": "limit", "confirm_orders": true}',
        risk_limits JSONB DEFAULT '{"max_position_size": 10000, "max_daily_loss": 500}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ User settings created');

    // 12. Audit Logs
    console.log('12. Creating audit_logs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id UUID,
        changes JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ Audit logs created');

    console.log('\n🎉 All 12 tables now created!\n');

    // Verify all 12 tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('📋 All tables in database:');
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });

    console.log(`\n✅ Total: ${tables.length} tables`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

createRemainingTables();
