-- BL-O-Meter v2: Kategorien, erweiterte Aktivitäten, Upvoting

-- Kategorien für Surveys
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'BL';

-- Kategorien für Live Sessions
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'BL';

-- Erweiterte Activity config (poll options etc. already in JSONB config)
-- Activity type 'scale' and 'openqa' added via type column

-- Upvoting für Open Q&A
CREATE TABLE IF NOT EXISTS live_upvotes (
  id SERIAL PRIMARY KEY,
  response_id INTEGER REFERENCES live_responses(id) ON DELETE CASCADE,
  session_hash VARCHAR(128) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(response_id, session_hash)
);

-- Themenspeicher
CREATE TABLE IF NOT EXISTS themenspeicher (
  id SERIAL PRIMARY KEY,
  category VARCHAR(100) DEFAULT 'BL',
  title VARCHAR(500) NOT NULL,
  description TEXT,
  is_priority BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'open',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS themenspeicher_votes (
  id SERIAL PRIMARY KEY,
  thema_id INTEGER REFERENCES themenspeicher(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(thema_id, user_id)
);

-- Update existing surveys to BL category
UPDATE surveys SET category = 'BL' WHERE category IS NULL;
UPDATE live_sessions SET category = 'BL' WHERE category IS NULL;

CREATE INDEX IF NOT EXISTS idx_surveys_category ON surveys(category);
CREATE INDEX IF NOT EXISTS idx_live_sessions_category ON live_sessions(category);
CREATE INDEX IF NOT EXISTS idx_live_upvotes_response ON live_upvotes(response_id);
