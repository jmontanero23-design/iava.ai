/**
 * Direct Table Creation - No SQL file parsing
 */

import dotenv from 'dotenv';
dotenv.config();

import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.iava_DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ No database URL found!');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function createTables() {
  console.log('📊 Creating tables directly in Neon...\n');

  try {
    // Create users table
    console.log('1. Creating users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
      )
    `;
    console.log('✅ Users table created');

    // Create sessions table
    console.log('2. Creating sessions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL UNIQUE,
        ip_address INET,
        user_agent TEXT,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ Sessions table created');

    // Create trades table
    console.log('3. Creating trades table...');
    await sql`
      CREATE TABLE IF NOT EXISTS trades (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        symbol VARCHAR(10) NOT NULL,
        side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
        qty NUMERIC NOT NULL,
        filled_qty NUMERIC DEFAULT 0,
        avg_fill_price NUMERIC,
        order_type VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        filled_at TIMESTAMP WITH TIME ZONE,
        strategy_name VARCHAR(100),
        unicorn_score INTEGER,
        notes TEXT
      )
    `;
    console.log('✅ Trades table created');

    // Create watchlists table
    console.log('4. Creating watchlists table...');
    await sql`
      CREATE TABLE IF NOT EXISTS watchlists (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        symbols TEXT[] NOT NULL DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ Watchlists table created');

    // Create ai_insights table
    console.log('5. Creating ai_insights table...');
    await sql`
      CREATE TABLE IF NOT EXISTS ai_insights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        symbol VARCHAR(10) NOT NULL,
        insight_type VARCHAR(50) NOT NULL,
        data JSONB NOT NULL,
        confidence NUMERIC(5,4),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE
      )
    `;
    console.log('✅ AI insights table created');

    console.log('\n🎉 All tables created successfully!\n');

    // Verify
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('📋 Tables in database:');
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

createTables();
