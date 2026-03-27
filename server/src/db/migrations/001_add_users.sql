-- Migration 001: Add users table and wire binders to users
-- Run this if your DB was created before auth was added.
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS guards).

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add user_id to binders if it doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'binders' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE binders
      ADD COLUMN user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE;

    CREATE INDEX idx_binders_user_id ON binders(user_id);
  END IF;
END
$$;
