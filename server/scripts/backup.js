import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { config } from '../src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runBackup = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(__dirname, '../../backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const dumpFile = path.join(backupDir, `shreeji-backup-${timestamp}.sql`);

  console.log('📦 Starting Shreeji Database Backup...');
  console.log(`📁 Target: ${dumpFile}`);

  if (!config.databaseUrl) {
    // Backup local JSON store
    const localDbPath = path.join(config.dataDir, 'local-db.json');
    if (fs.existsSync(localDbPath)) {
      const targetLocalBackup = path.join(backupDir, `local-db-backup-${timestamp}.json`);
      fs.copyFileSync(localDbPath, targetLocalBackup);
      console.log(`✅ [Local Store Backup] Successfully copied to: ${targetLocalBackup}`);
      process.exit(0);
    } else {
      console.error('❌ No active database or local-db.json found to back up.');
      process.exit(1);
    }
  }

  // Execute pg_dump for PostgreSQL
  console.log('🐘 Executing pg_dump against PostgreSQL instance...');
  const child = spawn('pg_dump', ['--dbname=' + config.databaseUrl, '-f', dumpFile], {
    shell: true,
    stdio: 'inherit',
  });

  child.on('close', (code) => {
    if (code === 0) {
      console.log(`✅ [PostgreSQL Backup] Dump successfully written to: ${dumpFile}`);
      process.exit(0);
    } else {
      console.error(`❌ [PostgreSQL Backup] pg_dump failed with exit code: ${code}`);
      process.exit(code);
    }
  });

  child.on('error', (err) => {
    console.error('💥 Failed to start pg_dump process:', err.message);
    process.exit(1);
  });
};

runBackup();
