import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg;
import { fileURLToPath } from 'url';
import { config } from '../src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('--- Shreeji PostgreSQL Migration Runner ---');
  if (!config.databaseUrl) {
    console.log('ℹ️ No DATABASE_URL configured in environment.');
    console.log('   In local development without PostgreSQL, schema is simulated by in-memory/JSON store.');
    console.log('   To run against PostgreSQL or Supabase, set DATABASE_URL in server/.env.');
    return;
  }

  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database.');

    const migrationsDir = path.resolve(__dirname, '../migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️ No migrations directory found at:', migrationsDir);
      client.release();
      await pool.end();
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration file(s):`);

    for (const file of files) {
      console.log(`⏳ Applying ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      await client.query(sql);
      console.log(`✅ Applied ${file}`);
    }

    // Verify existing tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('\n📊 Tables present in public schema:');
    res.rows.forEach((r) => console.log(`   - ${r.table_name}`));

    client.release();
    await pool.end();
    console.log('\n🎉 All migrations completed successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
