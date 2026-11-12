-- Everything lives in its own schema, so it never touches other projects in the same database.
CREATE SCHEMA IF NOT EXISTS pulse;
DROP TABLE IF EXISTS pulse.logs, pulse.habits, pulse.users CASCADE;

CREATE TABLE pulse.users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pulse.habits (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES pulse.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'times',
  goal NUMERIC NOT NULL CHECK (goal > 0),
  step NUMERIC NOT NULL DEFAULT 1 CHECK (step > 0),
  color TEXT NOT NULL DEFAULT '#c6ff3d',
  icon TEXT NOT NULL DEFAULT 'heart',
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_habits_user ON pulse.habits (user_id);

CREATE TABLE pulse.logs (
  id SERIAL PRIMARY KEY,
  habit_id INT NOT NULL REFERENCES pulse.habits(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  value NUMERIC NOT NULL CHECK (value >= 0),
  UNIQUE (habit_id, log_date)
);
CREATE INDEX idx_logs_date ON pulse.logs (log_date);
