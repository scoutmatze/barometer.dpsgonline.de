-- BL-O-Meter: Live-Session Erweiterung

-- Live Sessions
CREATE TABLE IF NOT EXISTS live_sessions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(255),
  session_date DATE,
  access_code VARCHAR(8) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);

-- Activities within a session
CREATE TABLE IF NOT EXISTS live_activities (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES live_sessions(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  title VARCHAR(255) NOT NULL,
  config JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'pending',
  sort_order INTEGER DEFAULT 0,
  opened_at TIMESTAMP,
  closed_at TIMESTAMP
);

-- Responses (anonymous)
CREATE TABLE IF NOT EXISTS live_responses (
  id SERIAL PRIMARY KEY,
  activity_id INTEGER REFERENCES live_activities(id) ON DELETE CASCADE,
  session_hash VARCHAR(128),
  value_numeric INTEGER,
  value_text TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(activity_id, session_hash)
);

CREATE INDEX IF NOT EXISTS idx_live_responses_activity ON live_responses(activity_id);
CREATE INDEX IF NOT EXISTS idx_live_activities_session ON live_activities(session_id);
CREATE INDEX IF NOT EXISTS idx_live_sessions_code ON live_sessions(access_code);
