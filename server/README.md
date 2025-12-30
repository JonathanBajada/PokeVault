# 🎮 PlayVault - Backend Server

**PlayVault** backend server provides a RESTful API for the card collection platform.

## 🛠️ Tech Stack

-  **Node.js** - JavaScript runtime
-  **Express 5** - Web framework
-  **TypeScript** - Type-safe development
-  **PostgreSQL** - Relational database
-  **pg** - PostgreSQL client

## 🚀 Getting Started

### Prerequisites

-  Node.js (v18 or higher)
-  PostgreSQL (v12 or higher)

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables in `.env`:

   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=playvault
   DB_USER=postgres
   DB_PASSWORD=your_password
   POKEMON_TCG_API_KEY=your_api_key
   ```

3. Create the database:

   ```sql
   CREATE DATABASE playvault;
   ```

4. Seed the database:

   ```bash
   npm run populate-cards-index
   npm run seed-cards
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:4000`

## 📝 Available Scripts

-  `npm run dev` - Start development server with hot reload
-  `npm run typecheck` - Type check TypeScript files
-  `npm run fetch-cards` - Fetch cards from external API
-  `npm run populate-cards-index` - Generate cards index JSON
-  `npm run seed-cards` - Seed the database with cards

## 🔌 API Endpoints

### Cards

-  `GET /cards` - Get paginated cards
   -  Query parameters: `page`, `limit`, `search`, `set`, `rarity`
-  `GET /cards/sets` - Get all unique set names

### Health

-  `GET /health` - Health check endpoint

## 📁 Project Structure

```
server/
├── src/
│   ├── routes/          # API route handlers
│   │   ├── cards.ts     # Card endpoints
│   │   └── users.ts     # User endpoints
│   ├── repositories/    # Data access layer
│   │   └── card-repository.ts
│   ├── db/              # Database configuration
│   │   ├── connection.ts
│   │   └── schema.sql
│   ├── scripts/         # Utility scripts
│   │   ├── fetch-all-cards.ts
│   │   ├── populate-cards-index.ts
│   │   └── seed-cards.ts
│   └── server.ts        # Express server setup
└── data/                # Card data files
```

## 🗄️ Database

The application uses PostgreSQL with the following main table:

-  **cards** - Stores card information (id, name, set_name, rarity, image_small_url)

Indexes are created on `name`, `set_name`, and `rarity` for optimal query performance.

## 🔒 Environment Variables

-  `DB_HOST` - Database host (default: localhost)
-  `DB_PORT` - Database port (default: 5432)
-  `DB_NAME` - Database name (default: playvault)
-  `DB_USER` - Database user (default: postgres)
-  `DB_PASSWORD` - Database password
-  `POKEMON_TCG_API_KEY` - API key for fetching card data
