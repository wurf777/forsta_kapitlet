# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Första Kapitlet is a full-stack book management app with AI-driven recommendations (via Google Gemini). React frontend + PHP REST API + MySQL database, hosted on one.com in production.

## Commands

```bash
# Frontend
npm run dev          # Vite dev server on localhost:5173
npm run build        # Production build to dist/
npm run lint         # ESLint
npm run preview      # Preview production build

# Backend (Docker)
docker-compose up -d       # Start MySQL (3306), PHP API (8080), phpMyAdmin (8081)
docker-compose down        # Stop services
docker-compose down -v     # Stop + purge data
docker-compose logs -f     # Tail logs
```

No test framework is configured. There are no test commands.

## Architecture

**Monorepo layout** (no workspace tooling):
- `src/` — React 19 frontend (Vite, TailwindCSS, React Router)
- `api/` — PHP 8.2+ REST API (plain PHP, no framework)
- `database/` — MySQL schema (`schema.sql`)
- `docker/` — Docker configs for local dev
- `doc/` — Project documentation (Swedish)

### Frontend (`src/`)

**Context provider hierarchy** (in `main.jsx`): `LanguageProvider` → `AuthProvider` → `BibbiProvider`

- `LanguageProvider` — i18n (Swedish/English), translations in `src/locales/{sv,en}.js`
- `AuthProvider` — JWT auth state, token in localStorage
- `BibbiProvider` — AI chat (Bibbi) state management

**Key services** (`src/services/`):
- `api.js` — REST client, attaches JWT from localStorage
- `gemini.js` — Google Gemini integration (Bibbi chat, recommendations, daily tips)
- `googleBooks.js` — Hybrid search: local DB first, then Google Books API to fill gaps
- `storage.js` — Hybrid storage: API when authenticated, localStorage fallback

**Pages** (`src/pages/`): Home (`/`), MyBooks (`/books`), BookDetail (`/book/:id`), Recommendations, Profile, Admin, BetaSignup

**Key components** (`src/components/`): Layout (nav header), ChatInterface (Bibbi AI widget), BookSearch, BookCard, AuthModal, ModeSelector, ProtectedRoute

### Backend (`api/`)

Plain PHP with PDO prepared statements. Entry config in `api/config.php` (DB connection, JWT helpers, CORS).

- `api/auth/` — register, login, verify, reset-password
- `api/books/` — search, create, get
- `api/user/` — library management (add/get/update/remove books)
- `api/admin/` — user management

JWT tokens expire after 7 days. Local environment auto-verifies user registration; production requires email verification.

### Database

Two separate MySQL 8.0 databases (InnoDB):
- **Dev** — Runs locally via Docker (port 3306), managed through phpMyAdmin on `localhost:8081`
- **Production** — Hosted on one.com, managed through one.com's phpMyAdmin

Schema in `database/schema.sql`. Core tables: `users`, `books`, `authors`, `book_authors`, `genres`, `book_genres`, `user_books`, `user_profiles`, `data_sources`. Books table includes AI-enriched fields (`ai_vibe`, `ai_tempo`, `ai_themes`, `ai_summary`, `data_quality_score`). Genres are pre-seeded in Swedish. Database credentials differ per environment (configured in `api/.env`).

## Environment Variables

**Frontend** (`.env`, prefixed `VITE_`):
- `VITE_GEMINI_API_KEY` — Google Gemini API key
- `VITE_API_BASE_URL` — Backend URL (e.g., `http://localhost:8080` locally)
- `VITE_ENABLE_LOCAL_DB` — Toggle local DB search

**Backend** (`api/.env`):
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS` — MySQL credentials
- `JWT_SECRET` — Signing secret (≥32 chars)
- `ENVIRONMENT` — `development` or `production`

## Key Patterns

- **Hybrid book search**: Search local DB first, complement with Google Books API if <5 results, deduplicate by ISBN/Google Books ID.
- **Graceful auth degradation**: Authenticated users sync to API; unauthenticated users fall back to localStorage.
- **Vite base URL**: `/` in dev, `/forsta-kapitlet/` in production (configured in `vite.config.js`).
- **AI model**: Gemini 2.5 Flash, temperature 0.9, max 1024 tokens. Bibbi chat is context-aware (user library, preferences, blocklist, current book).
- **TailwindCSS theme**: Custom colors `accent` (#2C7A7B), `highlight` (#D69E2E), `bg-primary`/`bg-secondary`. Fonts: Merriweather (headings), Inter (body).
