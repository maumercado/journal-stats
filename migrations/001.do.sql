CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


CREATE TABLE IF NOT EXISTS "profile" (
  id uuid DEFAULT uuid_generate_v4 (),
  PRIMARY KEY (id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_DATE,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_DATE,
  firstName varchar(255) NOT NULL,
  lastName varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  password varchar(255) NOT NULL
);

CREATE TYPE tradeType AS ENUM ('Long', 'Short');
CREATE TYPE tradeStatus AS ENUM ('Win', 'Lose');

CREATE TABLE IF NOT EXISTS trades (
  id uuid DEFAULT uuid_generate_v4 (),
  PRIMARY KEY (id),
  profile_id uuid NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES "profile"(id),
  symbol varchar(255) NOT NULL,
  tradeType tradeType NOT NULL,
  entryDateTime TIMESTAMP NOT NULL,
  entryPrice float NOT NULL,
  tradeQuantity int NOT NULL,
  pnl float NOT NULL,
  tradeStatus tradeStatus NOT NULL,
  exitDateTime TIMESTAMP NOT NULL,
  exitPrice float NOT NULL,
  maxOpenQuantity int NOT NULL,
  account varchar(255) NOT NULL,
  steps jsonb NOT NULL,
  duration float NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_DATE,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX trades_profile_id_idx ON trades (profile_id);
CREATE UNIQUE INDEX trades_entryDateTime_idx ON trades (entryDateTime);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profile_updated_at BEFORE UPDATE
ON "profile" FOR EACH ROW EXECUTE PROCEDURE
update_updated_at_column();

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE
ON trades FOR EACH ROW EXECUTE PROCEDURE
update_updated_at_column();
