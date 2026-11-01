-- Shreeji Real Estate Platform Migration 006
-- WhatsApp Dispatch & Sales Team Handoff Tracking Table

CREATE TABLE IF NOT EXISTS whatsapp_dispatches (
  id VARCHAR(64) PRIMARY KEY,
  kyc_application_id VARCHAR(64) REFERENCES client_kyc_applications(id) ON DELETE SET NULL,
  inquiry_id VARCHAR(64),
  recipient_number VARCHAR(50) NOT NULL DEFAULT '919825799754',
  client_name VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50) NOT NULL,
  message_type VARCHAR(50) DEFAULT 'kyc_reservation',
  property_ref VARCHAR(255),
  agent_code VARCHAR(100),
  message_body TEXT NOT NULL,
  dispatch_url TEXT NOT NULL,
  delivery_channel VARCHAR(50) DEFAULT 'whatsapp_direct',
  status VARCHAR(50) DEFAULT 'dispatched',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_recipient ON whatsapp_dispatches(recipient_number);
CREATE INDEX IF NOT EXISTS idx_wa_kyc_app_id ON whatsapp_dispatches(kyc_application_id);
CREATE INDEX IF NOT EXISTS idx_wa_client_phone ON whatsapp_dispatches(client_phone);
CREATE INDEX IF NOT EXISTS idx_wa_created_at ON whatsapp_dispatches(created_at DESC);
