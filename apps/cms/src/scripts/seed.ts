/**
 * Seed magazine folder packs + Devi Navaratri Jnanodayam readings.
 *
 * Magazine packs live in content/magazine/YYYY-MM/ (Te/En txt + images).
 * Sample 2026-10 uses public copy inspired by qluglobal.org / programs.qluglobal.org
 * (see that pack's issue.json → sources). Re-run after editing folder packs.
 *
 * Usage (from apps/cms, with Postgres up and .env set):
 *   npm run seed
 *   npm run seed -- --month 2026-10
 *   npm run seed -- --skip-magazine
 *   npm run seed -- --skip-jnanodayam
 */

import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { getPayload } from 'payload'

import config from '../payload.config'
import {
  EMPTY_SECTION,
  SECTION_DIRS,
  SECTION_HEADINGS,
  folderToKey,
  type SectionKey,
} from '../lib/magazineSections'
import { textToLexical, type LexicalState } from '../lib/textToLexical'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../../../../')
const MAG_ROOT = path.join(REPO_ROOT, 'content', 'magazine')
const DEVI_ROOT = path.join(REPO_ROOT, 'content', 'jnanodayam-devi')

const DAY_SUBTITLES_EN: Record<number, string> = {
  1: 'Bathukamma · The Asura and the Hara Centre',
  2: 'The Empty Vessel · Shakti and Chaitanya',
  3: 'Sura and Asura · Svara and Apasvara',
  4: 'Cause, Symbol, and a New Birth',
  5: 'Two Navaratris · Aham and Sarvam',
  6: 'Parashakti · Mahishasura Mardini',
  7: 'The Sword of Knowledge · Sumbha and Nisumbha',
  8: 'Devi Shakti · Nature and the Power of Words',
  9: 'The First Principle · Shakti, Chaitanya, Knowledge',
  10: 'Vijayadashami — Divine Shakti, Self-Knowledge, and Spiritual Practice',
}

type Chapter = { title?: string; paras?: string[] }

function parseArgs(argv: string[]) {
  const flags = new Set(argv)
  let month: string | undefined
  const monthIdx = argv.indexOf('--month')
  if (monthIdx >= 0) month = argv[monthIdx + 1]
  return {
    month,
    skipMagazine: flags.has('--skip-magazine'),
    skipJnanodayam: flags.has('--skip-jnanodayam'),
  }
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function chaptersToHtml(chapters: Chapter[]): string {
  const parts: string[] = []
  for (const ch of chapters) {
    const title = escapeHtml(String(ch.title || ''))
    if (title) parts.push(`<h2>${title}</h2>`)
    for (const para of ch.paras || []) {
      parts.push(`<p>${escapeHtml(String(para))}</p>`)
    }
  }
  return parts.join('\n')
}

function extractChapters(html: string): Chapter[] {
  const m = html.match(/const chapters=(\[[\s\S]*?\]);\s*(?:const |$)/)
  if (!m) throw new Error('chapters array not found')
  return JSON.parse(m[1]) as Chapter[]
}

async function readOptional(file: string): Promise<string> {
  try {
    return await fs.readFile(file, 'utf8')
  } catch {
    return ''
  }
}

async function ensureAdmin(payload: Awaited<ReturnType<typeof getPayload>>) {
  const existing = await payload.find({
    collection: 'users',
    limit: 1,
    overrideAccess: true,
  })
  if (existing.totalDocs > 0) return

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@qlu.local'
  const password = process.env.SEED_ADMIN_PASSWORD || 'qlu-admin-change-me'
  await payload.create({
    collection: 'users',
    data: { email, password },
    overrideAccess: true,
  })
  console.log(`Created admin user ${email} (password from SEED_ADMIN_PASSWORD or default)`)
}

async function upsertMedia(
  payload: Awaited<ReturnType<typeof getPayload>>,
  filePath: string,
  alt: string,
) {
  const filename = path.basename(filePath)
  const found = await payload.find({
    collection: 'media',
    where: { filename: { equals: filename } },
    limit: 1,
    overrideAccess: true,
  })
  if (found.docs[0]) return found.docs[0].id

  const created = await payload.create({
    collection: 'media',
    data: { alt: alt || filename },
    filePath,
    overrideAccess: true,
  })
  return created.id
}

async function seedMagazine(
  payload: Awaited<ReturnType<typeof getPayload>>,
  month: string,
) {
  const issueDir = path.join(MAG_ROOT, month)
  const st = await fs.stat(issueDir).catch(() => null)
  if (!st?.isDirectory()) {
    throw new Error(`Missing magazine pack: ${issueDir}`)
  }

  let titleTe = `నెలవారీ పత్రిక — ${month}`
  let titleEn = `Monthly Magazine — ${month}`
  let sources: string[] = []
  try {
    const meta = JSON.parse(await fs.readFile(path.join(issueDir, 'issue.json'), 'utf8')) as {
      title_te?: string
      title_en?: string
      sources?: string[]
      note?: string
    }
    if (meta.title_te) titleTe = meta.title_te
    if (meta.title_en) titleEn = meta.title_en
    if (Array.isArray(meta.sources)) sources = meta.sources.filter(Boolean)
    if (meta.note) console.log(`  note: ${meta.note}`)
  } catch {
    /* optional */
  }
  if (sources.length) {
    console.log(`  sources: ${sources.join(' · ')}`)
  }

  const sections: Array<{
    key: SectionKey
    headingTe: string
    headingEn: string
    bodyTe: LexicalState
    bodyEn: LexicalState
    images: Array<{
      image: number | string
      align: 'center'
      size: 'md'
      captionTe?: string
      captionEn?: string
      altTe?: string
      altEn?: string
    }>
  }> = []

  for (const folder of SECTION_DIRS) {
    const key = folderToKey(folder)
    const dir = path.join(issueDir, folder)
    const exists = await fs.stat(dir).catch(() => null)
    const headings = SECTION_HEADINGS[key]
    let bodyTe = textToLexical(EMPTY_SECTION.te)
    let bodyEn = textToLexical(EMPTY_SECTION.en)
    const images: (typeof sections)[number]['images'] = []

    if (exists?.isDirectory()) {
      const teRaw = await readOptional(path.join(dir, 'content.te.txt'))
      const enRaw = await readOptional(path.join(dir, 'content.en.txt'))
      if (teRaw.trim()) bodyTe = textToLexical(teRaw)
      if (enRaw.trim()) bodyEn = textToLexical(enRaw)

      const files = await fs.readdir(dir)
      const stems = [
        ...new Set(
          files
            .filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f))
            .map((f) => path.parse(f).name)
            .sort(),
        ),
      ]
      for (const stem of stems) {
        const imgName = files.find(
          (f) => path.parse(f).name === stem && /\.(jpe?g|png|webp|gif)$/i.test(f),
        )
        if (!imgName) continue
        const imgPath = path.join(dir, imgName)
        const captionTe = (await readOptional(path.join(dir, `${stem}.caption.te.txt`))).trim()
        const captionEn = (await readOptional(path.join(dir, `${stem}.caption.en.txt`))).trim()
        const altTe = (await readOptional(path.join(dir, `${stem}.alt.te.txt`))).trim()
        const altEn = (await readOptional(path.join(dir, `${stem}.alt.en.txt`))).trim()
        const id = await upsertMedia(payload, imgPath, altEn || altTe || stem)
        images.push({
          image: id,
          align: 'center',
          size: 'md',
          captionTe: captionTe || undefined,
          captionEn: captionEn || undefined,
          altTe: altTe || undefined,
          altEn: altEn || undefined,
        })
      }
    }

    sections.push({
      key,
      headingTe: headings.te,
      headingEn: headings.en,
      bodyTe,
      bodyEn,
      images,
    })
  }

  const existing = await payload.find({
    collection: 'issues',
    where: { month: { equals: month } },
    limit: 1,
    overrideAccess: true,
  })

  const data = {
    month,
    titleTe,
    titleEn,
    published: true,
    sections,
  }

  const filled = sections.filter((s) => {
    const en = JSON.stringify(s.bodyEn)
    return en.length > 80 && !en.includes(EMPTY_SECTION.en.slice(0, 20))
  }).length
  const imageCount = sections.reduce((n, s) => n + (s.images?.length || 0), 0)

  if (existing.docs[0]) {
    await payload.update({
      collection: 'issues',
      id: existing.docs[0].id,
      data,
      overrideAccess: true,
    })
    console.log(
      `Updated issue ${month} (${sections.length} sections, ~${filled} with custom body, ${imageCount} images)`,
    )
  } else {
    await payload.create({
      collection: 'issues',
      data,
      overrideAccess: true,
    })
    console.log(
      `Created issue ${month} (${sections.length} sections, ~${filled} with custom body, ${imageCount} images)`,
    )
  }
}

async function seedJnanodayam(payload: Awaited<ReturnType<typeof getPayload>>) {
  const bannerPath = path.join(DEVI_ROOT, 'assets', 'devi-navaratrula-jnanam-banner.png')
  let coverId: string | number | undefined
  try {
    await fs.access(bannerPath)
    coverId = await upsertMedia(payload, bannerPath, 'Devi Navaratrula Jnanam')
  } catch {
    console.warn('No Devi banner found (optional):', bannerPath)
  }

  for (let day = 1; day <= 10; day++) {
    const num = String(day).padStart(2, '0')
    const enPath = path.join(DEVI_ROOT, `day-${num}-en.html`)
    const tePath = path.join(DEVI_ROOT, `day-${num}-te.html`)
    const enHtml = await fs.readFile(enPath, 'utf8')
    const teHtml = await fs.readFile(tePath, 'utf8')
    const bodyHtmlEn = chaptersToHtml(extractChapters(enHtml))
    const bodyHtmlTe = chaptersToHtml(extractChapters(teHtml))
    const subtitleEn = DAY_SUBTITLES_EN[day] || `Day ${day}`

    const data = {
      series: 'devi-navaratri' as const,
      day,
      published: true,
      subtitleEn,
      subtitleTe: subtitleEn,
      titleEn: `Devi Navaratrula Jnanam · Day ${day}`,
      titleTe: `దేవి నవరాత్రుల జ్ఞానం · రోజు ${day}`,
      bodyHtmlEn,
      bodyHtmlTe,
      ...(coverId ? { cover: coverId } : {}),
    }

    const existing = await payload.find({
      collection: 'jnanodayam-readings',
      where: {
        and: [{ series: { equals: 'devi-navaratri' } }, { day: { equals: day } }],
      },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs[0]) {
      await payload.update({
        collection: 'jnanodayam-readings',
        id: existing.docs[0].id,
        data,
        overrideAccess: true,
      })
      console.log(`Updated Devi day ${day}`)
    } else {
      await payload.create({
        collection: 'jnanodayam-readings',
        data,
        overrideAccess: true,
      })
      console.log(`Created Devi day ${day}`)
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const payload = await getPayload({ config })

  await ensureAdmin(payload)

  if (!args.skipMagazine) {
    const months = args.month
      ? [args.month]
      : (await fs.readdir(MAG_ROOT))
          .filter((n) => /^\d{4}-\d{2}$/.test(n))
          .sort()
    for (const month of months) {
      await seedMagazine(payload, month)
    }
  }

  if (!args.skipJnanodayam) {
    await seedJnanodayam(payload)
  }

  console.log('Seed complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
