CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS "profile" (
  id uuid DEFAULT uuid_generate_v4 (),
  PRIMARY KEY (id),
  created_at DATE NOT NULL DEFAULT CURRENT_DATE,
  firstName varchar(255) NOT NULL,
  lastName varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  password varchar(255) NOT NULL
);

CREATE TYPE tradeType AS ENUM ('Long', 'Short');
CREATE TYPE status AS ENUM ('Win', 'Lose');

CREATE TABLE IF NOT EXISTS trades (
  id uuid DEFAULT uuid_generate_v4 (),
  PRIMARY KEY (id),
  profile_id uuid NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES "profile"(id),
  symbol varchar(255) NOT NULL,
  tradeType tradeType NOT NULL,
  entryDateTime DATE NOT NULL,
  entryPrice float NOT NULL,
  tradeQuantity int NOT NULL,
  pnl float NOT NULL,
  status status NOT NULL,
  exitDateTime DATE NOT NULL,
  exitPrice float NOT NULL,
  maxOpenQuantity int NOT NULL,
  account varchar(255) NOT NULL,
  steps jsonb NOT NULL,
  duration float NOT NULL,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
);
