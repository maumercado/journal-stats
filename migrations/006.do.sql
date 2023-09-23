ALTER TABLE trades ADD COLUMN trade_rules_id UUID DEFAULT NULL;
ALTER TABLE trades ADD CONSTRAINT trades_trade_rules_id_fkey FOREIGN KEY (trade_rules_id) REFERENCES trade_rules (id);
