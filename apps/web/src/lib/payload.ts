const PAYLOAD_URL = (import.meta.env.PUBLIC_PAYLOAD_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
)

export type Lang = 'te' | 'en'

export type MediaDoc = {
  id: number | string
  url?: string | null
  alt?: string | null
  filename?: string | null
}

export type ImageAlign = 'left' | 'center' | 'right' | 'full'
export type ImageSize = 'sm' | 'md' | 'lg' | 'full'

export type ThemeItemImage = {
  id?: string
  image?: MediaDoc | number | string | null
}

export type ThemeItem = {
  id?: string
  titleTe?: string | null
  titleEn?: string | null
  blurbTe?: string | null
  blurbEn?: string | null
  fullStoryTe?: string | null
  fullStoryEn?: string | null
  image?: MediaDoc | number | string | null
  images?: ThemeItemImage[] | null
  storyUrl?: string | null
}

export type ClassItem = {
  id?: string
  titleTe?: string | null
  titleEn?: string | null
  speaker?: string | null
  date?: string | null
  insightTe?: string | null
  insightEn?: string | null
  fullStoryTe?: string | null
  fullStoryEn?: string | null
  storyUrl?: string | null
}

export type StoryItem = {
  id?: string
  name?: string | null
  location?: string | null
  bodyTe?: string | null
  bodyEn?: string | null
  fullStoryTe?: string | null
  fullStoryEn?: string | null
  storyUrl?: string | null
}

export type VisitItem = {
  id?: string
  date?: string | null
  place?: string | null
  noteTe?: string | null
  noteEn?: string | null
  fullStoryTe?: string | null
  fullStoryEn?: string | null
  storyUrl?: string | null
}

export type FeatureItem = {
  id?: string
  titleTe?: string | null
  titleEn?: string | null
  bodyTe?: string | null
  bodyEn?: string | null
  fullStoryTe?: string | null
  fullStoryEn?: string | null
  storyUrl?: string | null
}

export type EventItem = {
  id?: string
  when?: string | null
  titleTe?: string | null
  titleEn?: string | null
  venueTe?: string | null
  venueEn?: string | null
  detailsTe?: string | null
  detailsEn?: string | null
  fullStoryTe?: string | null
  fullStoryEn?: string | null
  storyUrl?: string | null
}

export type IssueSection = {
  id?: string
  key: string
  headingTe?: string | null
  headingEn?: string | null
  bodyTe?: unknown
  bodyEn?: unknown
  /** Themes experiment: render entry as a tall wrapping card in Print */
  asCard?: boolean | null
  leadTe?: string | null
  leadEn?: string | null
  themeItems?: ThemeItem[] | null
  classItems?: ClassItem[] | null
  stories?: StoryItem[] | null
  visitItems?: VisitItem[] | null
  featureItems?: FeatureItem[] | null
  golokaTe?: string | null
  golokaEn?: string | null
  golokaFullStoryTe?: string | null
  golokaFullStoryEn?: string | null
  golokaUrl?: string | null
  sahasraraTe?: string | null
  sahasraraEn?: string | null
  sahasraraFullStoryTe?: string | null
  sahasraraFullStoryEn?: string | null
  sahasraraUrl?: string | null
  qluTe?: string | null
  qluEn?: string | null
  qluFullStoryTe?: string | null
  qluFullStoryEn?: string | null
  qluUrl?: string | null

  eventItems?: EventItem[] | null
  images?: Array<{
    id?: string
    image?: MediaDoc | number | string | null
    align?: ImageAlign | null
    size?: ImageSize | null
    captionTe?: string | null
    captionEn?: string | null
    altTe?: string | null
    altEn?: string | null
  }>
}

export type Issue = {
  id: number | string
  month: string
  titleTe: string
  titleEn: string
  published?: boolean
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
  coverImage?: MediaDoc | number | string | null
  sections?: IssueSection[]
}

export type Reading = {
  id: number | string
  series: string
  day: number
  titleTe: string
  titleEn: string
  subtitleTe?: string | null
  subtitleEn?: string | null
  bodyHtmlTe?: string | null
  bodyHtmlEn?: string | null
  cover?: MediaDoc | number | string | null
  published?: boolean
}

export type GaneshaStory = {
  id: number | string
  slug: string
  sortOrder: number
  /** Theme tag for search/filter (e.g. Sri Ganesha Tattva) — not a site section. */
  label?: string | null
  titleTe: string
  titleEn: string
  taglineTe?: string | null
  taglineEn?: string | null
  bodyMarkdownTe?: string | null
  bodyMarkdownEn?: string | null
  jnanodayamDay?: number | null
  speaker?: string | null
  videoUrl?: string | null
  cover?: MediaDoc | number | string | null
  published?: boolean
}

/** Public story docs (collection slug remains ganesha-stories). */
export type Story = GaneshaStory

type ListResponse<T> = {
  docs: T[]
  totalDocs: number
}

async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${PAYLOAD_URL}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    throw new Error(`Payload ${res.status} for ${url}`)
  }
  return res.json() as Promise<T>
}

export function mediaUrl(media: MediaDoc | number | string | null | undefined): string | null {
  if (!media || typeof media === 'number' || typeof media === 'string') return null
  if (!media.url) return null
  if (media.url.startsWith('http')) return media.url
  return `${PAYLOAD_URL}${media.url}`
}

export async function listIssues(): Promise<Issue[]> {
  const data = await apiGet<ListResponse<Issue>>(
    '/api/issues?limit=50&sort=-month&depth=1&where[published][equals]=true',
  )
  return data.docs
}

export async function getIssue(month: string): Promise<Issue | null> {
  const data = await apiGet<ListResponse<Issue>>(
    `/api/issues?limit=1&depth=2&where[and][0][month][equals]=${encodeURIComponent(month)}&where[and][1][published][equals]=true`,
  )
  return data.docs[0] || null
}

export async function listReadings(series = 'devi-navaratri'): Promise<Reading[]> {
  const data = await apiGet<ListResponse<Reading>>(
    `/api/jnanodayam-readings?limit=50&sort=day&depth=1&where[and][0][series][equals]=${encodeURIComponent(series)}&where[and][1][published][equals]=true`,
  )
  return data.docs
}

export async function getReading(series: string, day: number): Promise<Reading | null> {
  const data = await apiGet<ListResponse<Reading>>(
    `/api/jnanodayam-readings?limit=1&depth=1&where[and][0][series][equals]=${encodeURIComponent(series)}&where[and][1][day][equals]=${day}&where[and][2][published][equals]=true`,
  )
  return data.docs[0] || null
}

export async function listStories(label?: string): Promise<Story[]> {
  const q = label?.trim()
    ? `/api/ganesha-stories?limit=50&sort=sortOrder&depth=1&where[and][0][published][equals]=true&where[and][1][label][equals]=${encodeURIComponent(label.trim())}`
    : '/api/ganesha-stories?limit=50&sort=sortOrder&depth=1&where[published][equals]=true'
  const data = await apiGet<ListResponse<Story>>(q)
  return data.docs
}

/** @deprecated Prefer listStories */
export async function listGaneshaStories(): Promise<GaneshaStory[]> {
  return listStories()
}

export async function getStory(slug: string): Promise<Story | null> {
  const data = await apiGet<ListResponse<Story>>(
    `/api/ganesha-stories?limit=1&depth=1&where[and][0][slug][equals]=${encodeURIComponent(slug)}&where[and][1][published][equals]=true`,
  )
  return data.docs[0] || null
}

/** @deprecated Prefer getStory */
export async function getGaneshaStory(slug: string): Promise<GaneshaStory | null> {
  return getStory(slug)
}

export function pickLang<T extends Record<string, unknown>>(
  doc: T,
  lang: Lang,
  teKey: keyof T,
  enKey: keyof T,
): string {
  const value = lang === 'te' ? doc[teKey] : doc[enKey]
  return typeof value === 'string' ? value : ''
}

const MONTH_NAMES_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function formatCoverKicker(month: string, lang: Lang, custom?: string | null): string {
  if (custom?.trim()) return custom.trim()
  const m = /^(\d{4})-(\d{2})$/.exec(month)
  if (!m) return month
  const year = m[1]
  const idx = Math.max(0, Math.min(11, Number(m[2]) - 1))
  if (lang === 'te') {
    return `${MONTH_NAMES_EN[idx].toUpperCase()} ${year} · సంచిక`
  }
  return `${MONTH_NAMES_EN[idx].toUpperCase()} ${year} · ISSUE`
}
