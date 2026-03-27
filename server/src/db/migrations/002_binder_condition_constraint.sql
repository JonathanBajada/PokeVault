-- Migration 002: Add CHECK constraint for condition values on binder_cards
-- quantity and condition columns already exist from the initial schema.
-- This migration locks condition down to the canonical set of values.
-- Note: This project uses raw SQL migrations, not Prisma.

ALTER TABLE binder_cards
  DROP CONSTRAINT IF EXISTS binder_cards_condition_check;

ALTER TABLE binder_cards
  ADD CONSTRAINT binder_cards_condition_check
  CHECK (condition IN (
    'Mint',
    'Near Mint',
    'Lightly Played',
    'Moderately Played',
    'Heavily Played',
    'Damaged'
  ));
