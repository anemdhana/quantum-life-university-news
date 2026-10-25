# Content & seed

Source of truth for sample data is the **`content/`** tree (not the Postgres dump).

## Magazine packs

Same layout as WordPress `qlu-monthly-newsletter`:

```
content/magazine/
  YYYY-MM/
    issue.json
    00-masthead/
    01-themes/
    …
    08-closing/
```

Per section:

| File | Role |
|------|------|
| `content.te.txt` / `content.en.txt` | Body (paragraphs + `- ` bullets) |
| `01.jpg` + `01.caption.te.txt` / `.en.txt` | Photos + captions |

Seed maps folders → Payload `issues.sections[].key` (`masthead`, `themes`, …).

**Sample `2026-10`:** Te/En copy is written as a realistic demo issue using **public** facts and quotes from [qluglobal.org](https://qluglobal.org/) and [programs.qluglobal.org](https://programs.qluglobal.org/) (founders, campus address, workshop categories, published testimonials, mission line). It is **not** an official QLU PDF. Confirm live dates/fees on those sites. See `content/magazine/2026-10/issue.json` → `sources`.

```powershell
npm run seed -w @qlu/cms -- --month 2026-10
```

## Jnanodayam (Devi)

```
content/jnanodayam-devi/
  day-01-en.html … day-10-te.html
  assets/devi-navaratrula-jnanam-banner.png
```

HTML files are the QLU day readers; the seed script extracts `const chapters=[…]` and stores Te/En HTML on `jnanodayam-readings`.

```powershell
npm run seed -w @qlu/cms -- --skip-magazine
```

## Editing after seed

Prefer **Payload admin** for copy tweaks. Re-running seed **overwrites** matching issues/days from disk.

### Magazine admin (simple)

| Field | How to edit |
|-------|-------------|
| Section body Te / En | **Lexical** rich text (headings, bold, lists — no raw HTML) |
| Images | Upload + optional **align** (`left` / `center` / `right` / `full`) and **size** (`sm` / `md` / `lg` / `full`) |
| Captions | Te / En text under each image |

Public magazine pages support **two layouts** (switcher on the issue page):

| Layout | URL | Experience |
|--------|-----|------------|
| **Flipbook** (default) | `/issues/YYYY-MM/te\|en/` | Landscape paper flip — one section per page |
| **News view** | `/issues/YYYY-MM/te\|en/?view=news` | Full-page Canva-style shell: sticky brand + nav, welcome, search, **ముఖ్యాంశాలు** photo grid (“పూర్తిగా చదవండి >>”), events, prose grid, contact footer |

**Responsive grid:** mobile = full-bleed 1-col story cards (~viewport height); tablet = 2-col; desktop = 3-col with featured span. Prose/events use a matching multi-col grid. Keyword search filters on-page; month “All issues…” → archive.

## Public URLs (Astro)

| Path | Content |
|------|---------|
| `/` | Home |
| `/jnanodayam/` | Programme index |
| `/jnanodayam/devi-navaratri/` | Day list |
| `/jnanodayam/devi-navaratri/{day}/{te\|en}/` | Reading |
| `/issues/` | Magazine archive |
| `/issues/{YYYY-MM}/{te\|en}/` | Issue — Flipbook |
| `/issues/{YYYY-MM}/{te\|en}/?view=news` | Issue — News view |
