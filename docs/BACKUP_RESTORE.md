# Shreeji Database Backup, Disaster Recovery & Restoration Guide

This document defines the backup procedures, Point-In-Time-Recovery (PITR) strategy, and disaster restoration protocol for the Shreeji PostgreSQL production database.

---

## 🗄️ Backup Strategies

### 1. Automated Daily Snapshots (Logical Dump)

Using `pg_dump` with custom compressed format (`.dump` / `.sql.gz`), automated daily via cron or CI/CD runner.

```bash
# Manual or cron backup command
cd server
node scripts/backup.js
```

The script connects to `DATABASE_URL`, dumps the entire schema, data, indexes, and triggers, and stores it in `server/backups/shreeji-backup-YYYY-MM-DD-HHmmss.dump`.

---

## 🔄 Restoration Procedure

### 1. Test Restoration on Staging / Recovery Host

```bash
# Restore specific backup file
cd server
node scripts/restore.js backups/shreeji-backup-YYYY-MM-DD-HHmmss.dump
```

### 2. Manual psql Restoration

```bash
# Uncompress and pipe to psql
pg_restore --clean --if-exists --no-owner --no-privileges -d "$DATABASE_URL" backups/shreeji-backup-xxx.dump
```

---

## ☁️ Cloud Provider Native Backups (Recommended for Production)

### Supabase / Neon

- **Continuous WAL Archiving**: Point-In-Time-Recovery (PITR) is automatically enabled on Supabase Pro/Team plans.
- Restore to any second in the past 7 days directly from the Supabase dashboard: **Database** -> **Backups** -> **Restore to point in time**.

### AWS RDS / DigitalOcean Managed PostgreSQL

- Automated daily snapshots retained for 14-30 days.
- Enable automated failover to multi-AZ standby replica for high availability.

---

## 📋 Disaster Recovery Checklist

1. [ ] Confirm primary database failure or corruption.
2. [ ] Identify latest verified backup timestamp.
3. [ ] Provision target database instance or prepare existing PostgreSQL container.
4. [ ] Run `node scripts/restore.js <path-to-dump>`.
5. [ ] Run `npm test` against restored database to verify schema and data integrity.
6. [ ] Update `DATABASE_URL` in production environment settings.
7. [ ] Issue zero-downtime server reload: `npm run prod:restart`.
