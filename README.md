# quantum-life-university-news

Headless **Jnanodayam reader** + **monthly magazine** for Quantum Life University.

| Layer | Stack |
|-------|--------|
| CMS / API / admin | **Payload CMS 3** (`apps/cms`) + Postgres |
| Public site | **Astro 7** (`apps/web`) |
| Seed packs | `content/magazine/YYYY-MM/`, `content/jnanodayam-devi/` |

WordPress sibling (classic PHP): [`qlu-monthly-newsletter`](../qlu-monthly-newsletter). Same content model and soft-paper look; this repo is the headless path described in that project’s `docs/CMS-ALTERNATIVE.md`.

Docs: [docs/README.md](./docs/README.md) · [Crash course](./docs/CRASH-COURSE.md) · [Local setup](./docs/LOCAL.md) · [Content & seed](./docs/CONTENT.md) · [Architecture](./docs/ARCHITECTURE.md) · [Hosting](./docs/newsletter_website_hosting_recommendation.md)

---

## Quick start

Needs **Node 22.21+**, **Docker**, **npm**.

```powershell
cd quantum-life-university-news
copy .env.example apps\cms\.env   # if cms .env missing; edit secrets
npm run db:up
npm install
npm run seed -w @qlu/cms
.\dev.cmd                        # CMS + Astro together (or use npm run below)
```

Or manually: `npm run dev:cms` and `npm run dev:web` in two terminals.

| Service | URL |
|---------|-----|
| Site | http://localhost:4321 |
| Payload admin | http://localhost:3000/admin |
| API | http://localhost:3000/api |

Default seed admin (change after first login): `admin@qlu.local` / `qlu-admin-change-me` (or `SEED_ADMIN_*` in `apps/cms/.env`).

---

## What’s included

- Magazine issues with fixed sections (`masthead` … `closing`), Te + En bodies and images  
- Devi Navaratrula Jnanam — 10 days, Te + En HTML bodies  
- Soft-paper / gold public UI (QLU look)  
- Folder seed from `content/` (same convention as the WordPress magazine packs)

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run db:up` | Start Postgres (Docker) |
| `npm run seed` | Import magazine + Devi readings |
| `npm run dev:cms` | Payload on :3000 |
| `npm run dev:web` | Astro on :4321 |
