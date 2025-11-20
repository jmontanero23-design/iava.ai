/**
 * Check Neon Database Tables
 */

import dotenv from 'dotenv';
dotenv.config();

import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.iava_DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ No database URL found!');
  process.exit(1);
}

console.log('📊 Connecting to Neon PostgreSQL...');

const sql = neon(databaseUrl);

async function checkTables() {
  try {
    // List all tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    console.log('\n✅ Connected to Neon!');
    console.log('\n📋 Tables in database:');

    if (tables.length === 0) {
      console.log('❌ NO TABLES FOUND - Need to run setup-database.js');
    } else {
      tables.forEach((table, index) => {
        console.log(`${index + 1}. ${table.table_name}`);
      });
    }

    // Check if users table exists and has data
    if (tables.some(t => t.table_name === 'users')) {
      const userCount = await sql`SELECT COUNT(*) as count FROM users`;
      console.log(`\n👥 Users in database: ${userCount[0].count}`);
    }

    console.log('\n✅ Database check complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTables();
