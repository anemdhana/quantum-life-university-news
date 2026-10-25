# Hosting recommendation — QLU News (Payload + Astro)

For the **Jnanodayam reader + monthly magazine** (Telugu + English), with admin editing and media uploads.

## Final recommended stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Hosting | **Hostinger VPS** (KVM 1 start → KVM 2 later) | Single server |
| Frontend | Astro (SSR) | Public site — reads Payload live |
| CMS | Payload CMS 3 | Issues, Jnanodayam, media |
| Database | PostgreSQL | Content |
| Media / PDFs | VPS disk (Docker volume) | Photos, optional PDF downloads |
| Reverse proxy | Caddy (or Nginx) | HTTPS |
| Deploy | Docker Compose | CMS + web + Postgres |
| Backups | Off-server daily | DB + media volumes |

## Start with KVM 1 (ok for now)

| | |
|--|--|
| **Specs** | 1 vCPU · **4 GB** RAM · 50 GB NVMe |
| **Price (approx., Oct 2026)** | Intro **~$6.49/mo** → renews **~$11.99/mo** |
| **OK for** | Starting Payload + Astro + Postgres with light traffic |
| **Watch** | RAM during builds/admin use; upgrade to **KVM 2** in the Hostinger panel if it feels tight |
| **Not for** | Shared WordPress plans — this stack needs a VPS |

Confirm live prices: [hostinger.com/vps-hosting](https://www.hostinger.com/vps-hosting).

## Comfortable: KVM 2

| | |
|--|--|
| **CPU / RAM** | 2 vCPU · 8 GB — Payload + Postgres + Astro together |
| **Disk** | ~100 GB NVMe — magazine photos + Devi media |
| **Price (approx., Oct 2026)** | Intro **~$8.79/mo** → renews **~$14.99/mo** |
| **Ops** | One box, flat price; you run Docker + Caddy |

**Path:** KVM 1 now → upgrade to KVM 2 when traffic or memory needs it.

## How it works

```text
Editors → Payload Admin (:3000 /admin)
              ↓
     PostgreSQL + media volume
              ↓
     Astro SSR public site
     (issues, jnanodayam, Te/En)
```

Publishing in Payload updates the public site on the next request (SSR). No full static rebuild required for v1.

Optional later: webhook → static rebuild if you move the public site to pure static hosting.

## Suggested product scope

- Monthly issue archive (`/issues/YYYY-MM/te|en/`)
- Jnanodayam series days (Te/En)
- Photos per magazine section
- Optional: upload finished monthly PDFs via Media (prefer upload over on-the-fly PDF generation)
- Draft / published in Payload

## Deploy shape (production)

On the VPS:

1. Docker Compose: `postgres` + `cms` (Payload) + `web` (Astro Node)
2. Caddy terminates HTTPS and proxies:
   - `news.example.com` → Astro
   - `cms.news.example.com` (or `/admin` on same host) → Payload
3. Daily backup of Postgres dump + media volume off-server

Local mirror of this idea: root `docker-compose.yml` (Postgres) + `apps/cms` + `apps/web` — see [LOCAL.md](./LOCAL.md) · [ARCHITECTURE.md](./ARCHITECTURE.md).

## Final call

**Start with Hostinger KVM 1 + Docker Compose (Payload + Astro SSR + PostgreSQL + Caddy).**  
Upgrade to **KVM 2** when needed. Keep media on the VPS disk; add object storage (R2/S3) only if you outgrow the disk or need multi-server media.
