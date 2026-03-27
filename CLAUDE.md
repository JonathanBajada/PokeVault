# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PokeVault is a full-stack Pokémon card collection platform. Users can browse a catalog of Pokémon cards and manage personal binders. The stack is a Next.js frontend (port 3000) communicating with an Express backend (port 4000) backed by PostgreSQL.

## Commands

### Frontend (`web/`)
```bash
npm run dev       # Start dev server at localhost:3000
npm run build     # Production build
npm run lint      # ESLint
npm run typecheck # TypeScript check
```

### Backend (`server/`)
```bash
npm run dev       # Start dev server with hot reload at localhost:4000
npm run typecheck # TypeScript check

# Database management
npm run create-schema     # Create all tables
npm run seed-cards        # Seed DB with card data
npm run seed-new-schema   # Seed with new schema
npm run drop-tables       # Drop all tables

# Data pipeline
npm run fetch-cards           # Fetch cards from Pokémon TCG API
npm run populate-cards-index  # Generate cards index JSON
```

## Architecture

### Frontend (`web/`)
- **App Router** with pages at `/` (catalog), `/search` (advanced search), `/login`
- **TanStack Query** handles all data fetching and caching — API calls go through `web/lib/api/cards.ts`
- Components live in `web/components/`

### Backend (`server/src/`)
- **Routes**: `routes/cards.ts` (catalog) and `routes/users.ts` (binders/collections)
- **Data access**: `repositories/card-repository.ts` — all DB queries live here with parameterized SQL
- **DB connection**: `db/connection.ts` — PostgreSQL pool using `DATABASE_URL` env var

### Database
Normalized PostgreSQL schema with 13 tables. Cards have many related tables (`card_types`, `card_subtypes`, `attacks`, `attack_costs`, `abilities`, `card_weaknesses`, `card_resistances`, `card_pokedex_numbers`, `prices`). Users own `binders` which contain `binder_cards`.

Schema is defined in `server/src/db/schema.sql`.

## Environment Setup

### Backend (`server/.env`)
```
DATABASE_URL=postgresql://postgres@localhost:5432/pokevault
POKEMON_TCG_API_KEY=<your_key>
PORT=4000
```

### Frontend
The frontend currently points to `localhost:4000` directly. For production, set `NEXT_PUBLIC_API_URL`.

## CI
GitHub Actions runs `npm run typecheck` on both `web/` and `server/` for every push/PR to main.
