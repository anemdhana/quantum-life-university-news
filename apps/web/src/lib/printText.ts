/** Preserve textarea newlines as block paragraphs for Print view. */
export function linesToParagraphs(raw: string): string[] {
  return raw
    .replace(/\r\n/g, '\n')
    .split(/\n/)
    .map((l) => l.trimEnd())
    .reduce<string[]>((acc, line) => {
      if (line.trim() === '') {
        // keep a blank paragraph marker for extra spacing between bullets/lines
        if (acc.length && acc[acc.length - 1] !== '') acc.push('')
        return acc
      }
      acc.push(line.trim())
      return acc
    }, [])
}

export type FlowBlock =
  | { kind: 'title'; text: string }
  | { kind: 'html'; html: string; chars: number }
  | { kind: 'text'; text: string }
  | { kind: 'link'; href: string; label: string; external?: boolean; id?: string }

/** Split rich HTML into block-level chunks for packing into cards. */
export function htmlToFlowBlocks(html: string): FlowBlock[] {
  const raw = (html || '').trim()
  if (!raw) return []
  const parts = raw
    .split(/(?=<p\b|<h[1-6]\b|<ul\b|<ol\b|<blockquote\b|<li\b)/i)
    .map((p) => p.trim())
    .filter(Boolean)
  if (!parts.length) {
    const plain = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    return plain ? [{ kind: 'text', text: plain }] : []
  }
  return parts
    .map((htmlPart) => {
      const chars = htmlPart.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length
      return { kind: 'html' as const, html: htmlPart, chars }
    })
    .filter((b) => b.chars > 0)
}

function blockChars(block: FlowBlock): number {
  if (block.kind === 'title') return block.text.length
  if (block.kind === 'text') return block.text.length
  if (block.kind === 'link') return block.label.length
  return block.chars
}

/** Break a long plain string into readable pieces for the next card. */
function splitPlain(text: string, max = 280): string[] {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean) return []
  if (clean.length <= max) return [clean]
  const out: string[] = []
  let rest = clean
  while (rest.length > max) {
    let cut = rest.lastIndexOf('. ', max)
    if (cut < max * 0.4) cut = rest.lastIndexOf(' ', max)
    if (cut < max * 0.4) cut = max
    // include the period when we split on ". "
    const end = rest.slice(cut, cut + 2) === '. ' ? cut + 1 : cut
    out.push(rest.slice(0, end).trim())
    rest = rest.slice(end).trim()
  }
  if (rest) out.push(rest)
  return out
}

function expandBlocks(blocks: FlowBlock[]): FlowBlock[] {
  const out: FlowBlock[] = []
  for (const block of blocks) {
    if (block.kind === 'title' || block.kind === 'link') {
      out.push(block)
      continue
    }
    if (block.kind === 'text') {
      for (const piece of splitPlain(block.text)) out.push({ kind: 'text', text: piece })
      continue
    }
    // Keep short HTML paragraphs intact; split only oversized blobs
    if (block.chars > 320) {
      const plain = block.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      for (const piece of splitPlain(plain, 260)) out.push({ kind: 'text', text: piece })
    } else {
      out.push(block)
    }
  }
  return out
}

/**
 * Pack content blocks into vertical card columns.
 * First card can take fewer chars when a photo occupies space.
 * Overflow continues into the next side-by-side card.
 */
export function packFlowIntoCards(
  blocks: FlowBlock[],
  opts?: { firstBudget?: number; nextBudget?: number },
): FlowBlock[][] {
  const firstBudget = opts?.firstBudget ?? 280
  const nextBudget = opts?.nextBudget ?? 520
  const expanded = expandBlocks(blocks)
  if (!expanded.length) return [[]]

  const cards: FlowBlock[][] = []
  let current: FlowBlock[] = []
  let used = 0
  let budget = firstBudget

  for (const block of expanded) {
    const size = Math.max(blockChars(block), 24)
    if (current.length && used + size > budget) {
      cards.push(current)
      current = []
      used = 0
      budget = nextBudget
    }
    current.push(block)
    used += size
  }
  if (current.length) cards.push(current)
  return cards.length ? cards : [[]]
}
