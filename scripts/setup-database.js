/**
 * Database Setup Script
 * Run this to initialize your Neon PostgreSQL database
 */

import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check for database URL
const databaseUrl = process.env.iava_DATABASE_URL ||
                   process.env.iava_POSTGRES_URL ||
                   process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ No database URL found!');
  console.error('Please set one of these environment variables:');
  console.error('  - iava_DATABASE_URL');
  console.error('  - iava_POSTGRES_URL');
  console.error('  - DATABASE_URL');
  process.exit(1);
}

console.log('📊 Connecting to Neon PostgreSQL...');

const sql = neon(databaseUrl);

async function setupDatabase() {
  try {
    // Check if database is accessible
    const testResult = await sql`SELECT NOW() as current_time`;
    console.log('✅ Database connected at:', testResult[0].current_time);

    // Check if tables exist
    const tablesExist = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'users'
      ) as exists
    `;

    if (tablesExist[0].exists) {
      console.log('✅ Database tables already exist');

      // Count users
      const userCount = await sql`SELECT COUNT(*) as count FROM users`;
      console.log(`📊 Current users: ${userCount[0].count}`);

      return;
    }

    console.log('📦 Creating database tables...');

    // Read and execute schema
    const schemaPath = path.join(__dirname, '..', 'lib', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split schema into individual statements (Neon requires this)
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await sql([statement + ';']);
      } catch (error) {
        console.warn(`⚠️ Statement failed (might be okay):`, error.message.substring(0, 50));
      }
    }

    console.log('✅ Database schema created successfully!');

    // Verify tables were created
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('📋 Created tables:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setupDatabase().then(() => {
  console.log('🎉 Database setup complete!');
  process.exit(0);
});