# Deploy on Azure — small VM + PostgreSQL Flexible Server

Run **QLU News** (Payload CMS + Astro SSR) on a small **Azure Linux VM**, with the database on **Azure Database for PostgreSQL – Flexible Server** (managed). No Docker required on the VM; Compose is optional later.

Companions: [Hosting overview](./newsletter_website_hosting_recommendation.md) · [Architecture](./ARCHITECTURE.md) · [Local setup](./LOCAL.md)

---

## Target shape

```text
Editors / readers (HTTPS)
        │
        ▼
┌───────────────────────────────┐
│  Azure Linux VM (small)       │
│  Caddy → TLS                  │
│    news.example.com  → :4321  │  Astro SSR
│    cms.example.com   → :3000  │  Payload (Next)
│  Media files on VM disk       │
└───────────────┬───────────────┘
                │ DATABASE_URL (SSL)
                ▼
┌───────────────────────────────┐
│  Azure Database for PostgreSQL│
│  Flexible Server              │
└───────────────────────────────┘
```

| Piece | Azure resource | Runs |
|-------|----------------|------|
| Public site + CMS processes | **Virtual Machine** (Linux) | Node 22+, Caddy |
| Database | **PostgreSQL Flexible Server** | Managed Postgres |
| Media / uploads | **VM disk** (OS or data disk) | Payload `media` folder |
| DNS | Your registrar or Azure DNS | A / AAAA → VM public IP |

Same app code as local / Hostinger; only hostnames and `DATABASE_URL` change.

---

## Suggested sizes (start small)

### Virtual Machine

| | Recommendation |
|--|----------------|
| **SKU** | **B2s** (2 vCPU, 4 GiB) to start; **B2ms** (8 GiB) if builds/admin feel tight |
| **OS** | Ubuntu **22.04** or **24.04** LTS |
| **Disk** | Premium SSD ≥ **64 GB** (OS); add a data disk later if media grows |
| **Region** | Same region as Flexible Server (e.g. `Central India`, `East US`) |

B-series is enough for light magazine + Jnanodayam traffic. Upgrade the VM size in the portal when RAM is the bottleneck (Payload + `next build` are memory-hungry).

### PostgreSQL Flexible Server

| | Recommendation |
|--|----------------|
| **Compute** | **Burstable B1ms** or **B2s** for low traffic |
| **Storage** | Start **32 GB**; autogrow on |
| **Version** | PostgreSQL **16** (or 15) |
| **HA** | Off at first (cheaper); turn on later if needed |
| **Backup** | Keep Azure automated backups (7+ days) |

Put VM and Flexible Server in the **same region** to cut latency and egress surprises.

---

## 1. Create Flexible Server

In Azure Portal → **Azure Database for PostgreSQL flexible servers** → Create:

1. **Workload**: Development (or Production if you prefer stricter defaults).
2. **Compute + storage**: Burstable, small SKU as above.
3. **Authentication**: PostgreSQL authentication (user + password). Save the admin user.
4. **Networking** (pick one):

   | Mode | Pros | Cons |
   |------|------|------|
   | **Public access** + firewall allow **VM public IP** | Simple to start | DB reachable from internet (locked to IPs) |
   | **Private access (VNet integration)** | DB not on public internet | VM must be in same/peered VNet; more setup |

   For a first deploy, **public access + firewall rule for the VM’s public IP only** is fine. Add your home IP temporarily for `psql` admin, then remove it.

5. Create database (after server is up), e.g. `qlu_news`:

```bash
# From a machine allowed in the firewall (or Azure Cloud Shell with access)
psql "host=<server>.postgres.database.azure.com port=5432 dbname=postgres user=<admin>@<server> sslmode=require" \
  -c "CREATE DATABASE qlu_news;"
```

Connection string shape:

```text
postgres://USER:PASSWORD@SERVER.postgres.database.azure.com:5432/qlu_news?sslmode=require
```

URL-encode special characters in the password. Flexible Server often expects username as `adminuser` (not always `adminuser@server` on newer flexible servers — use the portal “Connect” blade if unsure).

---

## 2. Create the small VM

1. **Virtual machines** → Create → Ubuntu LTS.
2. Size: **B2s** (or B2ms).
3. **Inbound ports**: allow **22** (SSH), **80**, **443**. Do **not** expose 3000/4321 publicly; Caddy proxies them.
4. Prefer **SSH key** auth.
5. Same **region** (and ideally same resource group) as Postgres.
6. Note the **public IP** (use a static public IP if you want DNS to stay stable).

NSG reminder: only 22/80/443 from the internet. Postgres stays on Flexible Server (firewall / private network), not on the VM.

---

## 3. DNS

Create records (example):

| Name | Type | Value |
|------|------|--------|
| `news.example.com` | A | VM public IP |
| `cms.example.com` | A | VM public IP |

Wait for propagation before enabling HTTPS in Caddy.

---

## 4. Soften the VM (Node + Caddy, no Docker)

SSH in:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git build-essential curl
```

### Node.js 22+

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # >= 22.21
npm -v
```

### App user and clone

```bash
sudo adduser --disabled-password --gecos "" qlu
sudo mkdir -p /var/www/qlu-news
sudo chown qlu:qlu /var/www/qlu-news
sudo -u qlu -i
cd /var/www/qlu-news
git clone <YOUR_REPO_URL> .
# or upload a release tarball
```

Monorepo layout expected:

- `apps/cms` — Payload
- `apps/web` — Astro

Install (from repo root if you use workspaces, or per app):

```bash
cd /var/www/qlu-news
npm install
cd apps/cms && npm install && cd ../..
cd apps/web && npm install && cd ../..
```

### Environment — CMS

`apps/cms/.env` (production values):

```env
DATABASE_URL=postgres://USER:PASSWORD@SERVER.postgres.database.azure.com:5432/qlu_news?sslmode=require
PAYLOAD_SECRET=<long-random-string>
PAYLOAD_PUBLIC_SERVER_URL=https://cms.example.com
PUBLIC_WEB_URL=https://news.example.com
```

### Environment — Web

`apps/web/.env`:

```env
PUBLIC_PAYLOAD_URL=https://cms.example.com
```

Astro inlines `PUBLIC_*` at **build** time — set the real HTTPS CMS URL **before** `npm run build`.

### Build

```bash
cd /var/www/qlu-news/apps/cms
npm run build

cd /var/www/qlu-news/apps/web
npm run build
```

Optional first-time content (only if you want seed packs):

```bash
cd /var/www/qlu-news/apps/cms
npm run seed
```

Change the seed admin password immediately after first login.

### Media directory

Payload stores uploads on the CMS host. Ensure the process can write its media folder (under `apps/cms` as configured). Back this path up with the database (see below). Prefer a dedicated disk mount later, e.g. `/var/qlu-media`, if the OS disk fills up.

---

## 5. Keep processes up (systemd)

### Payload CMS

`/etc/systemd/system/qlu-cms.service`:

```ini
[Unit]
Description=QLU News Payload CMS
After=network.target

[Service]
Type=simple
User=qlu
WorkingDirectory=/var/www/qlu-news/apps/cms
Environment=NODE_ENV=production
EnvironmentFile=/var/www/qlu-news/apps/cms/.env
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Astro web

Astro `@astrojs/node` standalone entry is typically `dist/server/entry.mjs` after build. Confirm the path on your build, then:

`/etc/systemd/system/qlu-web.service`:

```ini
[Unit]
Description=QLU News Astro site
After=network.target

[Service]
Type=simple
User=qlu
WorkingDirectory=/var/www/qlu-news/apps/web
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=4321
EnvironmentFile=/var/www/qlu-news/apps/web/.env
ExecStart=/usr/bin/node ./dist/server/entry.mjs
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now qlu-cms qlu-web
sudo systemctl status qlu-cms qlu-web
```

Both should listen on **localhost** only (`127.0.0.1:3000` and `127.0.0.1:4321`). If Astro binds `0.0.0.0`, still keep NSG closed on those ports.

---

## 6. Caddy (HTTPS reverse proxy)

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```

`/etc/caddy/Caddyfile`:

```caddy
news.example.com {
	reverse_proxy 127.0.0.1:4321
}

cms.example.com {
	reverse_proxy 127.0.0.1:3000
}
```

```bash
sudo systemctl reload caddy
```

Caddy obtains Let’s Encrypt certificates automatically when DNS points at the VM and ports 80/443 are open.

**Single-host alternative:** one domain with `/` → Astro and `/admin`, `/api`, `/media` → Payload. That needs a slightly richer Caddyfile and matching `PAYLOAD_PUBLIC_SERVER_URL` / `PUBLIC_PAYLOAD_URL` on the same origin — two hostnames is simpler for v1.

---

## 7. Firewall checklist

| Resource | Rule |
|----------|------|
| VM NSG | Inbound **22** (lock to your IP if possible), **80**, **443** |
| VM NSG | No public **3000** / **4321** |
| Flexible Server | Allow **Azure VM public IP** (public mode) or private VNet only |
| Flexible Server | Remove temporary admin IPs when done |

---

## 8. Deploy updates

```bash
sudo -u qlu -i
cd /var/www/qlu-news
git pull
cd apps/cms && npm install && npm run build
cd ../web && npm install && npm run build
sudo systemctl restart qlu-cms qlu-web
```

Builds need free RAM; on B2s (4 GiB) stop one service or use a temporary larger SKU if `next build` OOMs.

---

## 9. Backups

| What | How |
|------|-----|
| **Database** | Azure Flexible Server automatic backups + optional `pg_dump` to storage |
| **Media** | Cron `rsync`/`azcopy` of the Payload media directory to **Azure Blob** or another off-VM location |

Example dump (from an allowed client):

```bash
pg_dump "host=SERVER.postgres.database.azure.com port=5432 dbname=qlu_news user=USER sslmode=require" \
  -Fc -f qlu_news_$(date +%F).dump
```

Test a restore once; backups you never restore are theatre.

---

## 10. Optional: Docker only for apps

You can still use **Docker Compose on the VM** for `cms` + `web` while **Postgres stays on Flexible Server**:

- Omit the Compose `postgres` service.
- Point `DATABASE_URL` at Flexible Server (`sslmode=require`).
- Mount a host volume for media.
- Caddy (or Traefik) on the VM as above.

That keeps managed DB benefits without running Postgres yourself.

---

## 11. Cost ballpark (USD, list price)

Indicative **pay-as-you-go** totals for light magazine traffic. Region and currency change the bill — always confirm in the [Azure pricing calculator](https://azure.microsoft.com/pricing/calculator/). Figures below use common **East US**-class list prices (approx. late 2026); India regions are often a bit higher on compute.

### Lean starter (what the doc recommends first)

| Item | SKU / note | ~USD / month |
|------|------------|--------------|
| Linux VM | **B2s** (2 vCPU, 4 GiB), always on | **~$30–35** |
| OS disk | ~64 GB Premium SSD | **~$5–10** |
| Public IP | Static basic/standard | **~$3–4** |
| PostgreSQL Flexible | **Burstable B1ms** (1 vCore, 2 GiB) | **~$12–18** |
| DB storage | ~32 GB provisioned | **~$4–5** |
| Bandwidth / misc | Low traffic, same-region | **~$0–10** |
| **Total (lean)** | | **~$55–80 / month** |

### More comfortable

| Item | Change | ~USD / month |
|------|--------|--------------|
| VM | **B2ms** (8 GiB) — easier Payload builds | **+$15–25** vs B2s |
| Postgres | **B2s** Flexible (2 vCore, 4 GiB) | **~$50** compute alone (East US) |
| **Total (comfortable)** | B2ms VM + B2s DB + disks | **~$100–140 / month** |

### What usually stays small

- **Backups:** Flexible Server includes backup storage up to ~100% of provisioned DB size; extras are cheap at low volume.
- **HTTPS / Caddy:** free (Let’s Encrypt on the VM).
- **Egress:** readers hitting the VM for HTML/images; keep media on the VM disk so you are not pulling blobs across regions.

### Compared with Hostinger KVM

| | Azure lean | Hostinger KVM 1 (all-in-one) |
|--|------------|------------------------------|
| ~Monthly | **~$55–80** | **~$7–12** (intro/renew; see hosting doc) |
| Postgres | Managed Flexible Server | Postgres in Docker on same box |
| Why pay more | SLA-ish managed DB, Azure org/compliance, scale knobs | Lowest cost for the same apps |

**Rule of thumb:** expect **about $60–80/month** to start on Azure with B2s + B1ms; budget **~$100+** if you want a roomier VM and larger Flexible Server. Use a free trial / credits to validate before committing.

---

## 12. Cost & ops notes

- Prefer **same region** for VM and DB.
- Watch **egress** if you pull large media through the CMS often; storing media on the VM disk keeps reader traffic on the VM.
- When you outgrow the VM disk, move media to **Azure Blob** and teach Payload to use it (future enhancement; not required for v1).
- For org SSO / compliance, Azure is a natural fit; for lowest cost hobby hosting, see [Hostinger VPS + Compose](./newsletter_website_hosting_recommendation.md).

---

## Quick verify

1. `https://cms.example.com/admin` — login  
2. `https://news.example.com` — public site loads  
3. Upload a small image in Payload; confirm it appears on the site  
4. `sudo systemctl status qlu-cms qlu-web caddy` — all active  

If the site builds but shows empty API data, check `PUBLIC_PAYLOAD_URL` was correct **at Astro build time**, and that Flexible Server firewall allows the VM.
