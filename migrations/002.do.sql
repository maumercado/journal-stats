CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  profile_id uuid NOT NULL,
  token TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_profile_id_index ON sessions (profile_id);
CREATE INDEX IF NOT EXISTS sessions_token_index ON sessions (token);
CREATE INDEX IF NOT EXISTS sessions_expires_at_index ON sessions (expires_at);
