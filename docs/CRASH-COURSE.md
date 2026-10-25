# Crash course — Payload CMS + Astro for QLU News

A short primer so you know **what** each piece does, **how** they work together, and **why** this stack fits Quantum Life University’s magazine + Jnanodayam site.

---

## 1. Headless in one sentence

**Payload** stores and edits content (admin + API). **Astro** draws the public website by reading that API. The browser never runs WordPress PHP — only the pages Astro builds or serves.

```text
Editors  →  Payload Admin (/admin)
                ↓
           PostgreSQL + media files
                ↓
           REST API (/api/…)
                ↓
Readers  →  Astro site (flipbook magazine, Jnanodayam pages)
```

---

## 2. Payload CMS (the brain)

**What it is:** An open-source, TypeScript **headless CMS** that runs on Node (this repo: Next.js app in `apps/cms`). You define **collections** (like custom post types); Payload gives you an admin UI and a REST/GraphQL API for free.

**What we use it for:**

| Collection | Role |
|------------|------|
| `issues` | Monthly magazine (`YYYY-MM`), Te/En titles, sections, images |
| `jnanodayam-readings` | Series + day readings (e.g. Devi Navaratri) |
| `media` | Photos / uploads |
| `users` | Editor logins |

**Things to remember:**

- **Admin** = `http://localhost:3000/admin` — Lexical rich text, image align/size, publish checkbox.
- **API** = `http://localhost:3000/api/issues`, `/api/jnanodayam-readings`, etc.
- Content lives in **Postgres**, not in git. Folder packs under `content/` are for **seed/import**, then you edit in admin.
- Only **published** docs are public; logged-in editors can see drafts.

**Mental model:** Payload ≈ “WordPress admin + database,” without forcing the public site to be WordPress themes/plugins.

---

## 3. Astro (the face)

**What it is:** A **web framework** focused on content sites. By default it ships little or no JavaScript to the browser. Pages are `.astro` files (HTML-like + frontmatter).

**What we use it for:**

| Route | Experience |
|-------|------------|
| `/` | Home — latest issue + Jnanodayam entry |
| `/issues/…` | Magazine archive + **landscape flipbook** reader |
| `/jnanodayam/…` | Programme hub + day readings Te/En |

**SSR (server-side render):** Magazine/Jnanodayam dynamic URLs fetch Payload **on each request**, so a publish in admin shows up on refresh — no full static rebuild required for v1.

**Mental model:** Astro ≈ “the designed reader” — soft-paper look, flipbook, Te|En — while Payload holds the raw content.

---

## 4. Why this pair fits QLU News

| Need | How Payload + Astro help |
|------|---------------------------|
| **Monthly magazine with fixed sections** | Structured fields (`masthead` … `closing`), not freeform page soup |
| **Telugu + English** | Parallel Te/En fields on the same issue/reading |
| **Jnanodayam series** | Separate collection (series + day), same soft-paper brand |
| **Editors without HTML** | Lexical rich text + image layout in admin |
| **Nice reading experience** | Astro owns layout (flipbook, chips, landscape) — CMS doesn’t dictate theme hacks |
| **Smaller public attack surface** | No PHP plugin zoo on the public site; harden Node + Postgres instead |
| **Seed from folders** | Same pack idea as the WordPress repo; `npm run seed` fills Payload |
| **Host on one VPS** | CMS + Astro + Postgres via Docker on Hostinger KVM (see hosting doc) |

**Compared to classic WordPress:** WP is still great for drag-and-drop blocks. This stack wins when you want **typed content**, a **custom reader UI**, and a clearer split between “edit” and “display.”

---

## 5. Day-to-day flow

1. **Edit** in Payload admin (or re-seed from `content/magazine/YYYY-MM/`).
2. **Publish** the issue / reading.
3. **Open** the Astro site — flipbook or Jnanodayam page loads fresh data from the API.

Local: `.\dev.cmd` → Postgres + Payload `:3000` + Astro `:4321`.

---

## 6. Glossary (tiny)

| Term | Meaning here |
|------|----------------|
| **Collection** | A content type (issues, readings, media) |
| **Lexical** | Payload’s rich-text editor (stores JSON, we render HTML on the site) |
| **SSR** | Server renders the page when someone visits (live CMS data) |
| **Seed** | Script that imports folder packs into Payload |
| **Headless** | CMS has no mandatory public theme; any front-end can consume the API |

---

## 7. Where to go next

| Doc | Topic |
|-----|--------|
| [LOCAL.md](./LOCAL.md) | Install, ports, seed |
| [CONTENT.md](./CONTENT.md) | Folder packs, admin fields, URLs |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Apps and data flow |
| [Hosting](./newsletter_website_hosting_recommendation.md) | Hostinger VPS |
| [CMS-ALTERNATIVE.md](../../qlu-monthly-newsletter/docs/CMS-ALTERNATIVE.md) | Why headless vs WordPress (sibling repo) |

Official deep dives: [payloadcms.com/docs](https://payloadcms.com/docs) · [docs.astro.build](https://docs.astro.build)
