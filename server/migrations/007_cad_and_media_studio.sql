-- Shreeji Real Estate Platform Migration 007
-- AutoCAD Projects, Photos, Videos & Detailed Media Content Studio

CREATE TABLE IF NOT EXISTS project_media (
  id VARCHAR(64) PRIMARY KEY,
  project_id VARCHAR(64),
  plot_number VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  media_type VARCHAR(50) NOT NULL DEFAULT 'photo',
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  author VARCHAR(100) DEFAULT 'Shreeji Admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_project ON project_media(project_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON project_media(media_type);
CREATE INDEX IF NOT EXISTS idx_media_created ON project_media(created_at DESC);
