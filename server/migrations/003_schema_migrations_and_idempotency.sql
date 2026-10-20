-- Shreeji E-Commerce Migration 003
-- Migration Tracking & Order Idempotency Schema Extension

-- 1. Schema Migrations Audit Table
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) UNIQUE NOT NULL,
  applied_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add Idempotency Key to Orders Table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders(idempotency_key);
