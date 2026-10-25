/** Serialize Payload Lexical JSON (or legacy HTML string) to safe-ish HTML for magazine bodies. */

type LexNode = {
  type?: string
  text?: string
  format?: number | string
  tag?: string
  listType?: string
  children?: LexNode[]
  [key: string]: unknown
}

type LexicalDoc = {
  root?: LexNode
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function textFormat(format: number | string | undefined, text: string): string {
  let out = escapeHtml(text)
  const f = typeof format === 'number' ? format : 0
  // Lexical bitwise: bold=1, italic=2, strikethrough=4, underline=8, code=16
  if (f & 16) out = `<code>${out}</code>`
  if (f & 1) out = `<strong>${out}</strong>`
  if (f & 2) out = `<em>${out}</em>`
  if (f & 8) out = `<u>${out}</u>`
  if (f & 4) out = `<s>${out}</s>`
  return out
}

function renderChildren(nodes: LexNode[] | undefined): string {
  if (!nodes?.length) return ''
  return nodes.map(renderNode).join('')
}

function renderNode(node: LexNode): string {
  switch (node.type) {
    case 'text':
      return textFormat(node.format, node.text || '')
    case 'linebreak':
      return '<br />'
    case 'paragraph': {
      const inner = renderChildren(node.children)
      return inner ? `<p>${inner}</p>` : '<p></p>'
    }
    case 'heading': {
      const tag = (node.tag as string) || 'h2'
      const safe = ['h1', 'h2', 'h3', 'h4'].includes(tag) ? tag : 'h2'
      return `<${safe}>${renderChildren(node.children)}</${safe}>`
    }
    case 'list': {
      const tag = node.listType === 'number' || node.tag === 'ol' ? 'ol' : 'ul'
      return `<${tag}>${renderChildren(node.children)}</${tag}>`
    }
    case 'listitem':
      return `<li>${renderChildren(node.children)}</li>`
    case 'quote':
      return `<blockquote>${renderChildren(node.children)}</blockquote>`
    case 'link': {
      const url = String((node.fields as { url?: string } | undefined)?.url || node.url || '#')
      const href = escapeHtml(url)
      return `<a href="${href}">${renderChildren(node.children)}</a>`
    }
    case 'autolink': {
      const url = String((node.fields as { url?: string } | undefined)?.url || '#')
      return `<a href="${escapeHtml(url)}">${renderChildren(node.children)}</a>`
    }
    default:
      return renderChildren(node.children)
  }
}

/** Convert Lexical editor state or legacy HTML string to HTML. */
export function lexicalToHtml(data: unknown): string {
  if (data == null) return ''
  if (typeof data === 'string') return data
  if (typeof data !== 'object') return ''

  const doc = data as LexicalDoc
  if (!doc.root) return ''
  return renderChildren(doc.root.children)
}

export function isLexicalEmpty(data: unknown): boolean {
  const html = lexicalToHtml(data).replace(/<[^>]+>/g, '').trim()
  return !html
}

/** Plain text for teasers (NewsView cards). */
export function lexicalToPlain(data: unknown, maxLen = 160): string {
  const text = lexicalToHtml(data)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length <= maxLen) return text
  return `${text.slice(0, maxLen).replace(/\s+\S*$/, '')}…`
}
