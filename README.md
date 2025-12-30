# PokeVault 🧩

PokeVault is a full-stack web application that lets Pokémon card collectors create digital binders to showcase the cards they own and connect with others to trade or sell cards in real life.

The app is designed around how collectors actually use physical binders — browsing, organizing, and sharing their collections — while providing modern tools for discovery and communication.

---

## Core Concept

-  Users create a **personal digital binder** representing their real-life collection
-  Other users can browse binders to see which cards are available
-  Cards can be marked as **for trade** or **for sale**
-  Trading and selling happens **offline / in real life**, with the app acting as the discovery layer

---

## Features (Current)

-  📦 Paginated Pokémon card catalogue
-  🔍 Search and filter by name, rarity, and set
-  ⚡ Fast, cached data fetching with TanStack Query
-  🗄️ PostgreSQL-backed REST API
-  🧱 Clean separation between frontend and backend

---

## Planned Features

-  👤 User accounts
-  📚 Personal binders
-  🔁 Mark cards as “for trade” or “for sale”
-  💬 User-to-user contact for arranging real-life trades
-  📈 Binder visibility and discovery

---

## Tech Stack

### Frontend

-  Next.js (App Router)
-  React
-  TanStack Query
-  TypeScript

### Backend

-  Node.js
-  Express
-  PostgreSQL
-  SQL (parameterized queries)

---

## Architecture Overview
