/**
 * Derive reel “question + hook points” from existing blurbs (no CMS fields).
 */

const MD_NOISE = /[*_`#>\[\]()!~|]/g

function stripMd(text: string): string {
  return (text || '')
    .replace(/\r\n/g, '\n')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(MD_NOISE, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function trimHook(text: string, max = 110): string {
  const t = text.trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  const sp = cut.lastIndexOf(' ')
  return `${(sp > 40 ? cut.slice(0, sp) : cut).trim()}…`
}

/** Split into sentences; keeps Telugu danda / Latin .!? */
export function splitSentences(text: string): string[] {
  const clean = stripMd(text)
  if (!clean) return []
  const parts = clean.split(/(?<=[.?!\u0964])\s+|\n+/).map((s) => s.trim()).filter(Boolean)
  if (parts.length) return parts
  // Clause fallback on commas / em dashes
  return clean
    .split(/\s*[—–\-·|]\s+|,\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12)
}

export type ReelCopy = {
  question: string
  hooks: string[]
}

/**
 * Prefer an existing “?” sentence as the question.
 * Else use title (if short) or first sentence as the lead question-line.
 * Hooks = next 2–3 sentences (not repeating the question).
 */
export function deriveReelCopy(opts: {
  title?: string | null
  blurb?: string | null
  lang?: 'te' | 'en'
}): ReelCopy {
  const title = stripMd(opts.title || '')
  const sentences = splitSentences(opts.blurb || '')
  const withQ = sentences.find((s) => /[?\u061F]$/.test(s) || s.includes('?'))
  let question = withQ || ''

  if (!question) {
    if (title && title.length <= 90) {
      question = title
    } else if (sentences[0]) {
      question = sentences[0]
    } else {
      question = title || (opts.lang === 'te' ? 'ఈ బోధనలో ఏముంది?' : 'What does this teaching open?')
    }
  }

  const hooks = sentences
    .filter((s) => s !== withQ && s !== question)
    .slice(0, 3)
    .map((s) => trimHook(s))
    .filter(Boolean)

  if (!hooks.length && sentences.length) {
    // First sentence used as question — take later clauses if any
    hooks.push(...sentences.slice(1, 3).map((s) => trimHook(s)))
  }
  if (!hooks.length && opts.blurb) {
    const raw = stripMd(opts.blurb)
    if (raw && raw !== question) hooks.push(trimHook(raw, 120))
  }

  return {
    question: trimHook(question, 140),
    hooks: hooks.slice(0, 3),
  }
}
