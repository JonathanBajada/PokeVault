-- Migration 003: Add price_history table
-- Run this on existing databases that already have the base schema

CREATE TABLE IF NOT EXISTS price_history (
  id          SERIAL PRIMARY KEY,
  card_id     TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  price       NUMERIC(10, 2),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_card_recorded ON price_history (card_id, recorded_at DESC);
