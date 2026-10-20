import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { config } from '../src/config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupFileArg = process.argv[2];

if (!backupFileArg) {
  console.error('❌ Usage: node scripts/restore.js <path-to-backup-file>');
  process.exit(1);
}

const backupFilePath = path.resolve(process.cwd(), backupFileArg);

if (!fs.existsSync(backupFilePath)) {
  console.error(`❌ Backup file not found: ${backupFilePath}`);
  process.exit(1);
}

console.log(`🔄 Initiating restore from: ${backupFilePath}`);

if (backupFilePath.endsWith('.json')) {
  const localDbPath = path.join(config.dataDir, 'local-db.json');
  fs.copyFileSync(backupFilePath, localDbPath);
  console.log(`✅ [Local Store Restored] Successfully overwritten ${localDbPath}`);
  process.exit(0);
}

// PostgreSQL psql restore
if (!config.databaseUrl) {
  console.error('❌ DATABASE_URL is required to restore a PostgreSQL .sql backup.');
  process.exit(1);
}

console.log('🐘 Executing psql restore...');
const child = spawn('psql', ['--dbname=' + config.databaseUrl, '-f', backupFilePath], {
  shell: true,
  stdio: 'inherit',
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('✅ [PostgreSQL Restore] Successfully restored database!');
    process.exit(0);
  } else {
    console.error(`❌ [PostgreSQL Restore] psql failed with code: ${code}`);
    process.exit(code);
  }
});
