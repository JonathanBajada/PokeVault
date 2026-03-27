# 🗄️ PokeVault Database Setup Guide

This guide contains all PostgreSQL commands needed to set up and manage the PokeVault database.

> **Note:** This guide assumes you're using **zsh** as your shell. All command examples use zsh syntax.

## 📋 Prerequisites

-  PostgreSQL v12 or higher installed
-  PostgreSQL service running
-  Access to a PostgreSQL superuser account (typically `postgres`)
-  zsh shell (default on macOS)

## 🚀 Initial Setup

### 1. Connect to PostgreSQL

```bash
# Connect as postgres user (default)
psql -U postgres

# Or if you have a different user
psql -U your_username

# Or connect to a specific database
psql -U postgres -d postgres
```

### 2. Create the Database

```sql
-- Create the database
CREATE DATABASE pokevault;

-- Verify it was created
\l
```

### 3. Connect to the New Database

```sql
-- Connect to the pokevault database
\c pokevault

-- Or from command line (zsh)
psql -U postgres -d pokevault
```

### 4. Create the Schema

```sql
-- Run the schema file (from psql)
\i server/src/db/schema.sql

-- Or from command line (zsh)
psql -U postgres -d pokevault -f server/src/db/schema.sql
```

### 5. Verify Tables Were Created

```sql
-- List all tables
\dt

-- List all tables with details
\dt+

-- Show table structure
\d sets
\d cards
\d card_types
\d card_subtypes
\d attacks
\d attack_costs
\d abilities
\d card_weaknesses
\d card_resistances
\d card_pokedex_numbers
\d prices
\d binders
\d binder_cards
```

## 🔄 Common Operations

### View Database Information

```sql
-- List all databases
\l

-- List all tables in current database
\dt

-- Show table structure
\d table_name

-- Show all indexes
\di

-- Show all sequences
\ds

-- Show table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Table Row Counts

```sql
-- Count rows in each table
SELECT 'sets' as table_name, COUNT(*) FROM sets
UNION ALL
SELECT 'cards', COUNT(*) FROM cards
UNION ALL
SELECT 'card_types', COUNT(*) FROM card_types
UNION ALL
SELECT 'card_subtypes', COUNT(*) FROM card_subtypes
UNION ALL
SELECT 'attacks', COUNT(*) FROM attacks
UNION ALL
SELECT 'attack_costs', COUNT(*) FROM attack_costs
UNION ALL
SELECT 'abilities', COUNT(*) FROM abilities
UNION ALL
SELECT 'card_weaknesses', COUNT(*) FROM card_weaknesses
UNION ALL
SELECT 'card_resistances', COUNT(*) FROM card_resistances
UNION ALL
SELECT 'card_pokedex_numbers', COUNT(*) FROM card_pokedex_numbers
UNION ALL
SELECT 'prices', COUNT(*) FROM prices
UNION ALL
SELECT 'binders', COUNT(*) FROM binders
UNION ALL
SELECT 'binder_cards', COUNT(*) FROM binder_cards;
```

### Sample Queries

```sql
-- Get all sets
SELECT * FROM sets ORDER BY release_date DESC;

-- Get cards from a specific set
SELECT * FROM cards WHERE set_id = 'hgss4' LIMIT 10;

-- Get cards with their types
SELECT c.name, c.rarity, ct.type
FROM cards c
LEFT JOIN card_types ct ON c.id = ct.card_id
WHERE c.set_id = 'hgss4'
LIMIT 10;

-- Get cards with prices
SELECT c.name, c.rarity, p.variant, p.low, p.mid, p.high
FROM cards c
JOIN prices p ON c.id = p.card_id
WHERE p.source = 'tcgplayer'
ORDER BY p.mid DESC
LIMIT 10;
```

## 🗑️ Reset Database

### Drop All Tables (Fresh Start)

```sql
-- Connect to database
\c pokevault

-- Run the drop script
\i server/src/db/drop-tables.sql

-- Or manually drop tables
DROP TABLE IF EXISTS binder_cards CASCADE;
DROP TABLE IF EXISTS binders CASCADE;
DROP TABLE IF EXISTS prices CASCADE;
DROP TABLE IF EXISTS card_pokedex_numbers CASCADE;
DROP TABLE IF EXISTS card_resistances CASCADE;
DROP TABLE IF EXISTS card_weaknesses CASCADE;
DROP TABLE IF EXISTS abilities CASCADE;
DROP TABLE IF EXISTS attack_costs CASCADE;
DROP TABLE IF EXISTS attacks CASCADE;
DROP TABLE IF EXISTS card_subtypes CASCADE;
DROP TABLE IF EXISTS card_types CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS sets CASCADE;
```

### Drop and Recreate Database

```sql
-- Disconnect from the database first
\c postgres

-- Drop the database (this will fail if anyone is connected)
DROP DATABASE pokevault;

-- Recreate it
CREATE DATABASE pokevault;

-- Reconnect and recreate schema
\c pokevault
\i server/src/db/schema.sql
```

## 🔍 Useful Queries

### Find Duplicate Cards

```sql
-- Find cards with duplicate names in same set
SELECT name, set_id, COUNT(*) as count
FROM cards
GROUP BY name, set_id
HAVING COUNT(*) > 1;
```

### Check Index Usage

```sql
-- Show all indexes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Analyze Table Statistics

```sql
-- Update table statistics for query planner
ANALYZE sets;
ANALYZE cards;
ANALYZE card_types;
ANALYZE prices;
```

### Check Foreign Key Constraints

```sql
-- Show all foreign keys
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

## 🔐 User Management

### Create a Database User (Optional)

```sql
-- Create a new user for the application
CREATE USER pokevault_user WITH PASSWORD 'your_secure_password';

-- Grant privileges on the database
GRANT ALL PRIVILEGES ON DATABASE pokevault TO pokevault_user;

-- Connect to the database
\c pokevault

-- Grant privileges on all tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pokevault_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pokevault_user;

-- Grant privileges on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pokevault_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pokevault_user;
```

## 📊 Backup and Restore

### Create a Backup

```zsh
# Backup database to SQL file
pg_dump -U postgres -d pokevault -f pokevault_backup.sql

# Backup with custom format (compressed)
pg_dump -U postgres -d pokevault -F c -f pokevault_backup.dump

# Backup only schema (no data)
pg_dump -U postgres -d pokevault --schema-only -f pokevault_schema.sql

# Backup only data (no schema)
pg_dump -U postgres -d pokevault --data-only -f pokevault_data.sql
```

### Restore from Backup

```zsh
# Restore from SQL file
psql -U postgres -d pokevault -f pokevault_backup.sql

# Restore from custom format
pg_restore -U postgres -d pokevault pokevault_backup.dump
```

## 🔧 Troubleshooting

### Check Active Connections

```sql
-- Show all active connections
SELECT * FROM pg_stat_activity WHERE datname = 'pokevault';

-- Kill a specific connection (replace pid)
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'pokevault' AND pid <> pg_backend_pid();
```

### Check Database Size

```sql
-- Show database size
SELECT pg_size_pretty(pg_database_size('pokevault'));

-- Show size of all databases
SELECT
    datname,
    pg_size_pretty(pg_database_size(datname)) AS size
FROM pg_database
ORDER BY pg_database_size(datname) DESC;
```

### Check Table Sizes

```sql
-- Show size of all tables
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Vacuum Database

```sql
-- Vacuum to reclaim space
VACUUM;

-- Vacuum with analyze
VACUUM ANALYZE;

-- Vacuum full (requires exclusive lock, use carefully)
VACUUM FULL;
```

## 📝 Environment Variables

Make sure your `.env` file in the `server/` directory contains:

```env
# Option 1: Individual connection parameters
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pokevault
DB_USER=postgres
DB_PASSWORD=your_password

# Option 2: Connection string (if your app uses DATABASE_URL)
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/pokevault
```

## 🎯 Quick Reference

```zsh
# Connect to database
psql -U postgres -d pokevault

# Run SQL file
\i path/to/file.sql

# List tables
\dt

# Describe table
\d table_name

# Exit psql
\q

# Show help
\?
```

## 📚 Additional Resources

-  [PostgreSQL Documentation](https://www.postgresql.org/docs/)
-  [psql Command Reference](https://www.postgresql.org/docs/current/app-psql.html)
-  Schema file: `server/src/db/schema.sql`
-  Drop tables script: `server/src/db/drop-tables.sql`
