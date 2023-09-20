CREATE VIEW pnl_windows AS
  SELECT
    profile_id,
    DATE_TRUNC('hour', entryDateTime) AS entry_hour,
    FLOOR(EXTRACT(MINUTE FROM entryDateTime) / 30) AS entry_minute,
    SUM(pnl) AS pnl
  FROM trades
  GROUP BY profile_id, entry_hour, entry_minute
  HAVING DATE_TRUNC('hour', entryDateTime)::time >= '09:00:00'::time AND DATE_TRUNC('hour', entryDateTime)::time < '16:00:00'::time AND SUM(pnl) != 0
  ORDER BY pnl DESC;
