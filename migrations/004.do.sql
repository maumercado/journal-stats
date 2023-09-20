CREATE VIEW pnl_windows_profile AS
  SELECT
    profile_id,
    CASE
      WHEN EXTRACT(HOUR FROM entryDateTime) = 9 AND EXTRACT(MINUTE FROM entryDateTime) >= 30 THEN 'A'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 10 AND EXTRACT(MINUTE FROM entryDateTime) >= 00 THEN 'B'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 10 AND EXTRACT(MINUTE FROM entryDateTime) < 30 THEN 'B'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 10 AND EXTRACT(MINUTE FROM entryDateTime) >= 30 THEN 'C'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 11 AND EXTRACT(MINUTE FROM entryDateTime) < 00 THEN 'C'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 11 AND EXTRACT(MINUTE FROM entryDateTime) >= 00 THEN 'D'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 11 AND EXTRACT(MINUTE FROM entryDateTime) < 30 THEN 'D'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 11 AND EXTRACT(MINUTE FROM entryDateTime) >= 30 THEN 'E'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 12 AND EXTRACT(MINUTE FROM entryDateTime) < 00 THEN 'E'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 12 AND EXTRACT(MINUTE FROM entryDateTime) >= 00 THEN 'F'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 12 AND EXTRACT(MINUTE FROM entryDateTime) < 30 THEN 'F'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 12 AND EXTRACT(MINUTE FROM entryDateTime) >= 30 THEN 'G'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 13 AND EXTRACT(MINUTE FROM entryDateTime) < 00 THEN 'G'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 13 AND EXTRACT(MINUTE FROM entryDateTime) >= 00 THEN 'H'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 13 AND EXTRACT(MINUTE FROM entryDateTime) < 30 THEN 'H'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 13 AND EXTRACT(MINUTE FROM entryDateTime) >= 30 THEN 'I'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 14 AND EXTRACT(MINUTE FROM entryDateTime) < 00 THEN 'I'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 14 AND EXTRACT(MINUTE FROM entryDateTime) >= 00 THEN 'J'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 14 AND EXTRACT(MINUTE FROM entryDateTime) < 30 THEN 'J'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 14 AND EXTRACT(MINUTE FROM entryDateTime) >= 30 THEN 'K'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 15 AND EXTRACT(MINUTE FROM entryDateTime) < 00 THEN 'K'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 15 AND EXTRACT(MINUTE FROM entryDateTime) >= 00 THEN 'L'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 15 AND EXTRACT(MINUTE FROM entryDateTime) < 30 THEN 'L'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 15 AND EXTRACT(MINUTE FROM entryDateTime) >= 30 THEN 'M'
      WHEN EXTRACT(HOUR FROM entryDateTime) = 16 AND EXTRACT(MINUTE FROM entryDateTime) < 00 THEN 'M'
      ELSE NULL
    END AS window_letter,
    SUM(pnl) AS pnl
  FROM trades
  GROUP BY profile_id, window_letter
  HAVING SUM(pnl) != 0
  ORDER BY pnl DESC;
