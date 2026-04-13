-- BL-Barometer Database Schema

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  pin_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'BL',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  zusammenarbeit_items JSONB NOT NULL DEFAULT '[]',
  numeric_items JSONB NOT NULL DEFAULT '[]',
  freitext_items JSONB NOT NULL DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE surveys (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  subtitle VARCHAR(255),
  survey_date DATE,
  template_id INTEGER REFERENCES templates(id),
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  zusammenarbeit_items JSONB NOT NULL DEFAULT '[]',
  numeric_items JSONB NOT NULL DEFAULT '[]',
  freitext_items JSONB NOT NULL DEFAULT '[]',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,
  open_access_enabled BOOLEAN DEFAULT false
);

CREATE TABLE survey_agenda_items (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE survey_tokens (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE token_assignments (
  id SERIAL PRIMARY KEY,
  token_id INTEGER REFERENCES survey_tokens(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE open_access_sessions (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
  session_hash VARCHAR(128) NOT NULL,
  used_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(survey_id, session_hash)
);

CREATE TABLE responses (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER REFERENCES surveys(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE response_answers (
  id SERIAL PRIMARY KEY,
  response_id INTEGER REFERENCES responses(id) ON DELETE CASCADE,
  section VARCHAR(30) NOT NULL,
  question_key VARCHAR(255) NOT NULL,
  value_numeric INTEGER,
  value_text TEXT
);

CREATE INDEX idx_responses_survey ON responses(survey_id);
CREATE INDEX idx_answers_response ON response_answers(response_id);
CREATE INDEX idx_tokens_survey ON survey_tokens(survey_id);
CREATE INDEX idx_tokens_token ON survey_tokens(token);
CREATE INDEX idx_agenda_survey ON survey_agenda_items(survey_id);

INSERT INTO templates (name, description, is_default, zusammenarbeit_items, numeric_items, freitext_items)
VALUES (
  'BL-Standardfragen',
  'Standard-Frageset fuer Bundesleitungs-Sitzungen',
  true,
  '[
    "Unser Miteinander war wertschaetzend.",
    "Wir waren offen uns selbst und unseren Anliegen gegenueber.",
    "Wir hatten Spass und konnten miteinander lachen.",
    "Unsere Zusammenarbeit war konstruktiv.",
    "Wir haben vorausschauend und zielfuehrend gearbeitet.",
    "Wir haben auf Augenhoehe miteinander gearbeitet.",
    "Wir haben aufeinander Acht gegeben.",
    "Unsere Zusammenarbeit war abwechslungsreich."
  ]'::jsonb,
  '[
    {"key": "strategisch", "label": "Wie strategisch war unsere Arbeit?", "min": 1, "max": 10},
    {"key": "operativ", "label": "Wie operativ war unsere Arbeit?", "min": 1, "max": 10},
    {"key": "mehrwert", "label": "Mehrwert unserer Entscheidungen fuer Kinder und Jugendliche", "min": 1, "max": 5},
    {"key": "entwicklung", "label": "Beitrag zu deinen persoenlichen Entwicklungszielen", "min": 1, "max": 5},
    {"key": "belastung", "label": "Fuehlst du dich in der Lage, deine Aufgaben gut zu bewaeltigen?", "min": 1, "max": 5}
  ]'::jsonb,
  '[
    {"key": "gelungen", "label": "Welche TOPs und ihre methodische Umsetzung waren besonders gelungen?"},
    {"key": "themen", "label": "Welche 3 Themen werden uns in den naechsten 3 bis 6 Monaten besonders beschaeftigen?"},
    {"key": "sonstiges", "label": "Das moechte ich ausserdem noch loswerden..."}
  ]'::jsonb
);
