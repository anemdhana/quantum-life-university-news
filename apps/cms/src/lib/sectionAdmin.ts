import { PDF_CONTENTS_KEYS, PDF_SECTION_TITLES, type SectionKey } from './magazineSections'

export type EditLang = 'te' | 'en'

export type SectionRowLike = {
  id?: string
  key?: string | null
  headingTe?: string | null
  headingEn?: string | null
  leadTe?: string | null
  leadEn?: string | null
  themeItems?: unknown[] | null
  classItems?: unknown[] | null
  stories?: unknown[] | null
  visitItems?: unknown[] | null
  featureItems?: unknown[] | null
  eventItems?: unknown[] | null
  golokaTe?: string | null
  golokaEn?: string | null
  sahasraraTe?: string | null
  sahasraraEn?: string | null
  qluTe?: string | null
  qluEn?: string | null
}

const filled = (value: unknown) => typeof value === 'string' && value.trim().length > 0

const len = (value: unknown) => (Array.isArray(value) ? value.length : 0)

/** Count of structured PDF-slot content inside one section entry. */
export function countSectionContent(row: SectionRowLike | null | undefined, lang: EditLang): number {
  if (!row?.key) return 0

  switch (row.key) {
    case 'themes':
      return len(row.themeItems) + (filled(lang === 'te' ? row.leadTe : row.leadEn) ? 1 : 0)
    case 'highlight-classes':
      return len(row.classItems)
    case 'experiences':
      return len(row.stories)
    case 'visits':
      return len(row.visitItems)
    case 'vanya':
      return len(row.featureItems)
    case 'campus': {
      const values =
        lang === 'te'
          ? [row.golokaTe, row.sahasraraTe, row.qluTe]
          : [row.golokaEn, row.sahasraraEn, row.qluEn]
      return values.filter(filled).length
    }
    case 'upcoming':
      return len(row.eventItems)
    default:
      return 0
  }
}

/** Left-nav badge: how many content entries exist for this section key. */
export function countSectionEntries(
  rows: Array<{ key?: string | null } | null | undefined>,
  key: string,
): number {
  return rows.filter((row) => row?.key === key).length
}

export function entryLabel(
  row: SectionRowLike | null | undefined,
  lang: EditLang,
  fallbackIndex: number,
): string {
  const heading = (lang === 'te' ? row?.headingTe : row?.headingEn) || ''
  const trimmed = typeof heading === 'string' ? heading.trim() : ''
  if (trimmed) return trimmed.length > 42 ? `${trimmed.slice(0, 40)}…` : trimmed
  return lang === 'te' ? `ఎంట్రీ ${fallbackIndex + 1}` : `Entry ${fallbackIndex + 1}`
}

export function formatSectionAdminLabel(
  key: string | null | undefined,
  lang: EditLang,
  count: number,
): string {
  if (!key || !(key in PDF_SECTION_TITLES)) {
    return key ? `${key} (${count})` : `Section (${count})`
  }
  const meta = PDF_SECTION_TITLES[key as SectionKey]
  const title = lang === 'te' ? meta.te : meta.en
  return `${meta.num} / ${title} (${count})`
}

export function isWizardSectionKey(value: unknown): value is SectionKey {
  return typeof value === 'string' && (PDF_CONTENTS_KEYS as readonly string[]).includes(value)
}

export const WIZARD_SECTION_KEYS = PDF_CONTENTS_KEYS

/** Left-nav first item — issue meta + print cover slots */
export const WIZARD_COVER_KEY = 'cover' as const

export type WizardPaneKey = typeof WIZARD_COVER_KEY | SectionKey

export const WIZARD_NAV_KEYS: WizardPaneKey[] = [WIZARD_COVER_KEY, ...PDF_CONTENTS_KEYS]

export type CoverFieldsLike = {
  month?: string | null
  titleTe?: string | null
  titleEn?: string | null
  coverImage?: unknown
  taglineTe?: string | null
  taglineEn?: string | null
  foundersLineTe?: string | null
  foundersLineEn?: string | null
  foundersSubTe?: string | null
  foundersSubEn?: string | null
  invitationTe?: string | null
  invitationEn?: string | null
  coverKickerTe?: string | null
  coverKickerEn?: string | null
}

/** Count of filled issue/cover slots for the active editing language. */
export function countCoverContent(data: CoverFieldsLike | null | undefined, lang: EditLang): number {
  if (!data) return 0
  const values =
    lang === 'te'
      ? [
          data.month,
          data.titleTe,
          data.taglineTe,
          data.foundersLineTe,
          data.foundersSubTe,
          data.invitationTe,
          data.coverKickerTe,
        ]
      : [
          data.month,
          data.titleEn,
          data.taglineEn,
          data.foundersLineEn,
          data.foundersSubEn,
          data.invitationEn,
          data.coverKickerEn,
        ]
  return values.filter(filled).length + (data.coverImage ? 1 : 0)
}

export function formatCoverAdminLabel(lang: EditLang, count: number): string {
  const title = lang === 'te' ? 'సంచిక & ముఖచిత్రం' : 'Issue & cover'
  return `00 / ${title} (${count})`
}