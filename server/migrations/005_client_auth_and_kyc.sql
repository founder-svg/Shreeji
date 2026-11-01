-- Shreeji Real Estate Platform Migration 005
-- Client Authentication (User ID & Password) and KYC Verification (Aadhar & Business Intake)

-- 1. Client Users Table
CREATE TABLE IF NOT EXISTS client_users (
  id VARCHAR(64) PRIMARY KEY,
  client_id VARCHAR(64) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  agent_code VARCHAR(100),
  role VARCHAR(50) DEFAULT 'client',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_users_client_id ON client_users(client_id);
CREATE INDEX IF NOT EXISTS idx_client_users_phone ON client_users(phone);
CREATE INDEX IF NOT EXISTS idx_client_users_email ON client_users(email);
CREATE INDEX IF NOT EXISTS idx_client_users_agent_code ON client_users(agent_code);

-- 2. Client KYC Applications Table
CREATE TABLE IF NOT EXISTS client_kyc_applications (
  id VARCHAR(64) PRIMARY KEY,
  client_user_id VARCHAR(64) REFERENCES client_users(id) ON DELETE CASCADE,
  client_id VARCHAR(64) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  address_street TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) DEFAULT 'Gujarat',
  pincode VARCHAR(20) NOT NULL,
  occupation VARCHAR(100),
  company_name VARCHAR(255),
  work_details TEXT,
  annual_income_or_budget VARCHAR(100),
  aadhar_number VARCHAR(50) NOT NULL,
  aadhar_document_url TEXT,
  aadhar_document_back_url TEXT,
  pan_number VARCHAR(50),
  interested_project_id VARCHAR(64),
  interested_plot_number VARCHAR(100),
  interested_plot_area VARCHAR(100),
  interested_plot_value VARCHAR(100),
  agent_code VARCHAR(100),
  verification_status VARCHAR(50) DEFAULT 'pending',
  admin_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kyc_client_user_id ON client_kyc_applications(client_user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_client_id ON client_kyc_applications(client_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verification_status ON client_kyc_applications(verification_status);
CREATE INDEX IF NOT EXISTS idx_kyc_agent_code ON client_kyc_applications(agent_code);
CREATE INDEX IF NOT EXISTS idx_kyc_created_at ON client_kyc_applications(created_at DESC);
