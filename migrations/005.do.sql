CREATE TABLE IF NOT EXISTS trade_rules (
  id uuid DEFAULT uuid_generate_v4 (),
  PRIMARY KEY (id),
  profile_id uuid NOT NULL,
  trade_id uuid DEFAULT NULL,
  disabled BOOLEAN NOT NULL DEFAULT FALSE,
  version SERIAL NOT NULL,
  rule_list JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES "profile" (id)
);
