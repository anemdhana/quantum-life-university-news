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

export type IssueSection = {
  id?: string
  key: string
  headingTe?: string | null
  headingEn?: string | null
  bodyTe?: unknown
  bodyEn?: unknown
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

export function pickLang<T extends Record<string, unknown>>(
  doc: T,
  lang: Lang,
  teKey: keyof T,
  enKey: keyof T,
): string {
  const value = lang === 'te' ? doc[teKey] : doc[enKey]
  return typeof value === 'string' ? value : ''
}
