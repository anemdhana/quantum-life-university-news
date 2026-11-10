import { marked } from 'marked'

marked.setOptions({
  gfm: true,
  breaks: true, // single newlines → <br> (handy for pasted newsletter blurbs)
})

/** Render pasted Markdown (theme blurbs, short items, etc.) to safe-ish HTML. */
export function mdToHtml(raw?: string | null): string {
  const src = (raw || '').replace(/\r\n/g, '\n').trim()
  if (!src) return ''
  return marked.parse(src, { async: false }) as string
}

/** True when the string looks like Markdown rather than plain prose. */
export function looksLikeMarkdown(raw?: string | null): boolean {
  const s = (raw || '').trim()
  if (!s) return false
  return /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+\.\s|>\s)|(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\[[^\]]+\]\([^)]+\))/.test(
    s,
  )
}
