# Local development

## Prerequisites

- Node.js **22.21+** (Payload 3 docs prefer `^22.23.4` or `>=24.22.1`; 22.21/24.21 usually work for local)
- **Docker Desktop running** (Postgres via `docker compose`)
- npm (workspaces)

If `npm run db:up` fails with a pipe/`dockerDesktopLinuxEngine` error, start Docker Desktop and retry.

## First-time setup / Run

Double-click or run **`dev.cmd`** from the repo root. On first run it:

1. Creates `apps/cms/.env` and `apps/web/.env` from examples if missing  
2. Runs `npm install` if `node_modules` is missing  
3. Starts Postgres (`docker compose up -d --wait`)  
4. Runs **`npm run seed`** once (writes marker `.qlu-seeded`)  
5. Opens Payload (:3000) and Astro (:4321)

To force seed again: `del .qlu-seeded` or `set FORCE_SEED=1` then `.\dev.cmd`.

Manual equivalent:

```powershell
npm run db:up
npm install
npm run seed
npm run dev:cms
npm run dev:web
```

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
