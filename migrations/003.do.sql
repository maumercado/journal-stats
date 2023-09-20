CREATE OR REPLACE VIEW daily_pnl_summary AS
SELECT
  profile_id,
  date_trunc('day', entryDateTime) AS day,
  sum(pnl) AS total_pnl
FROM
  trades
GROUP BY
  profile_id,
  day
ORDER BY
  day DESC;

CREATE OR REPLACE VIEW weekly_pnl_summary AS
SELECT
  profile_id,
  date_trunc('week', entryDateTime) AS week,
  sum(pnl) AS total_pnl
FROM
  trades
GROUP BY
  profile_id,
  week
ORDER BY
  week DESC;


CREATE OR REPLACE VIEW monthly_pnl_summary AS
SELECT
  profile_id,
  date_trunc('month', entryDateTime) AS month,
  sum(pnl) AS total_pnl
FROM
  trades
GROUP BY
  profile_id,
  month
ORDER BY
  month DESC;

CREATE OR REPLACE VIEW yearly_pnl_summary AS
SELECT
  profile_id,
  date_trunc('year', entryDateTime) AS year,
  sum(pnl) AS total_pnl
FROM
  trades
GROUP BY
  profile_id,
  year
ORDER BY
  year DESC;

CREATE OR REPLACE VIEW pnl_summary AS
SELECT
  profile_id,
  sum(pnl) AS total_pnl
FROM
  trades
GROUP BY
  profile_id;

CREATE OR REPLACE VIEW pnl_summary_by_trade_type AS
SELECT
  profile_id,
  tradeType,
  sum(pnl) AS total_pnl
FROM
  trades
GROUP BY
  profile_id,
  tradeType;
