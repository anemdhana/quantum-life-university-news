# Local development

## Prerequisites

- Node.js **22.21+** (Payload 3 docs prefer `^22.23.4` or `>=24.22.1`; 22.21/24.21 usually work for local)
- **Docker Desktop running** (Postgres via `docker compose`)
- npm (workspaces)

If `npm run db:up` fails with a pipe/`dockerDesktopLinuxEngine` error, start Docker Desktop and retry.

## First-time setup

```powershell
cd c:\Users\dhana\GitHub\quantum-life-university-news
npm run db:up
# Ensure apps/cms/.env has DATABASE_URL + PAYLOAD_SECRET (create-payload-app already wrote one)
npm install
npm run seed -w @qlu/cms
```

## Run

Double-click or run **`dev.cmd`** from the repo root (starts Postgres, then CMS + Astro in two windows).

Or two terminals:

```powershell
npm run dev:cms
npm run dev:web
```

| URL | App |
|-----|-----|
| http://localhost:4321 | Astro site (SSR — reads Payload live) |
| http://localhost:3000/admin | Payload admin |
| http://localhost:3000/api/issues | REST |

Restart Astro after changing `astro.config.mjs` (or re-run `dev.cmd`).

## Re-seed

```powershell
npm run seed -w @qlu/cms
npm run seed -w @qlu/cms -- --month 2026-10
npm run seed -w @qlu/cms -- --skip-jnanodayam
npm run seed -w @qlu/cms -- --skip-magazine
```

Upserts by `month` (issues) and `series`+`day` (readings).

## Env

| File | Keys |
|------|------|
| `apps/cms/.env` | `DATABASE_URL` (Docker Postgres on **5433**), `PAYLOAD_SECRET`, `PAYLOAD_PUBLIC_SERVER_URL`, `PUBLIC_WEB_URL`, optional `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` |

Postgres is mapped to host **5433** so it does not clash with a local Windows Postgres on 5432.
| `apps/web/.env` | `PUBLIC_PAYLOAD_URL=http://localhost:3000` |

Root [`.env.example`](../.env.example) documents the shared values.
