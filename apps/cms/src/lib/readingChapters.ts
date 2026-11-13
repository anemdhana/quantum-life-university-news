export type ReadingChapter = {
  title: string
  paras: string[]
  words: number
  minutes: number
}

function decodeEntities(s: string): string {
  return s
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

/** Same split as the Astro reader (`<h2>` + `<p>` blocks). */
export function htmlToChapters(html: string | null | undefined): ReadingChapter[] {
  const raw = (html || '').trim()
  if (!raw) return []

  const chunks = raw.split(/<h2\b[^>]*>/i)
  const chapters: ReadingChapter[] = []

  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i]
    const close = chunk.search(/<\/h2>/i)
    if (close < 0) continue
    const title = decodeEntities(chunk.slice(0, close))
    const body = chunk.slice(close).replace(/^<\/h2>/i, '')
    const paras = [...body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => decodeEntities(m[1]))
      .filter(Boolean)
    if (!title && paras.length === 0) continue
    const words = countWords(paras.join(' '))
    chapters.push({
      title: title || `Section ${chapters.length + 1}`,
      paras,
      words,
      minutes: Math.max(1, Math.round(words / 200) || 1),
    })
  }

  if (chapters.length) return chapters

  const paras = [...raw.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => decodeEntities(m[1]))
    .filter(Boolean)
  if (!paras.length) {
    const text = decodeEntities(raw)
    if (!text) return []
    const words = countWords(text)
    return [
      {
        title: 'Reading',
        paras: [text],
        words,
        minutes: Math.max(1, Math.round(words / 200) || 1),
      },
    ]
  }
  const words = countWords(paras.join(' '))
  return [
    {
      title: 'Reading',
      paras,
      words,
      minutes: Math.max(1, Math.round(words / 200) || 1),
    },
  ]
}

export function chaptersToHtml(chapters: Array<{ title?: string; paras?: string[] }>): string {
  const parts: string[] = []
  for (const ch of chapters) {
    const title = escapeHtml(String(ch.title || '').trim())
    if (title) parts.push(`<h2>${title}</h2>`)
    for (const para of ch.paras || []) {
      const text = String(para || '').trim()
      if (text) parts.push(`<p>${escapeHtml(text)}</p>`)
    }
  }
  return parts.join('\n')
}

export function parasToText(paras: string[]): string {
  return paras.join('\n\n')
}

export function textToParas(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}
