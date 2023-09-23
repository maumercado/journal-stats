ALTER TABLE trades DROP COLUMN trade_rules_id;
DROP CONSTRAINT trades_trade_rules_id_fkey;
