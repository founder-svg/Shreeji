-- Shreeji Real Estate Platform Migration 004
-- Projects, Plots/Parcels, Map & 3D Assets, and Property Inquiries

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) DEFAULT 'Gandhidham',
  district VARCHAR(100) DEFAULT 'Kutch',
  state VARCHAR(100) DEFAULT 'Gujarat',
  status VARCHAR(50) DEFAULT 'active',
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  boundary_geometry JSONB DEFAULT '{}'::jsonb,
  gallery JSONB DEFAULT '[]'::jsonb,
  publication_state VARCHAR(50) DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_publication_state ON projects(publication_state);

-- 2. Plots / Parcels Table
CREATE TABLE IF NOT EXISTS plots (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  plot_number VARCHAR(100) NOT NULL,
  sector_ward VARCHAR(100),
  category VARCHAR(100) NOT NULL DEFAULT 'Commercial Plot',
  area NUMERIC(12, 2) NOT NULL,
  area_unit VARCHAR(50) DEFAULT 'Sq.Ft',
  price NUMERIC(14, 2) NOT NULL,
  pricing_type VARCHAR(50) DEFAULT 'lease',
  availability_status VARCHAR(50) DEFAULT 'available',
  surveyed_boundary_geometry JSONB DEFAULT '{}'::jsonb,
  dimensions JSONB DEFAULT '{}'::jsonb,
  rera_approved BOOLEAN DEFAULT TRUE,
  title_status VARCHAR(100) DEFAULT '100% Clear Title (7/12 & 8A)',
  features JSONB DEFAULT '[]'::jsonb,
  image_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_plot_per_project UNIQUE(project_id, plot_number)
);

CREATE INDEX IF NOT EXISTS idx_plots_project_id ON plots(project_id);
CREATE INDEX IF NOT EXISTS idx_plots_plot_number ON plots(plot_number);
CREATE INDEX IF NOT EXISTS idx_plots_availability_status ON plots(availability_status);
CREATE INDEX IF NOT EXISTS idx_plots_category ON plots(category);

-- 3. Map & 3D Assets Table
CREATE TABLE IF NOT EXISTS map_assets (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  asset_type VARCHAR(50) NOT NULL,
  storage_key VARCHAR(500) NOT NULL,
  url VARCHAR(500) NOT NULL,
  format VARCHAR(50) NOT NULL,
  file_size_bytes BIGINT,
  coordinate_reference_system VARCHAR(100) DEFAULT 'EPSG:4326',
  version VARCHAR(50) DEFAULT '1.0',
  publication_status VARCHAR(50) DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_map_assets_project_id ON map_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_map_assets_type ON map_assets(asset_type);

-- 4. Property Inquiries & Leads Table
CREATE TABLE IF NOT EXISTS property_inquiries (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  role VARCHAR(50) DEFAULT 'tenant',
  project_id VARCHAR(64) REFERENCES projects(id) ON DELETE SET NULL,
  plot_id VARCHAR(64) REFERENCES plots(id) ON DELETE SET NULL,
  property_category VARCHAR(100),
  preferred_location VARCHAR(255),
  budget_or_expected VARCHAR(100),
  builtup_area VARCHAR(100),
  message TEXT,
  source VARCHAR(100) DEFAULT 'website',
  assigned_staff_id VARCHAR(64) REFERENCES admin_users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prop_inq_status ON property_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_prop_inq_created_at ON property_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prop_inq_role ON property_inquiries(role);
CREATE INDEX IF NOT EXISTS idx_prop_inq_phone ON property_inquiries(phone);
