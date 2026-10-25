/** Build Payload Lexical editor state from plain magazine pack text. */

type LexicalTextNode = {
  type: 'text'
  text: string
  format: number
  detail: number
  mode: 'normal'
  style: string
  version: 1
}

type LexicalElement = {
  type: string
  version: 1
  format: string | number
  indent: number
  direction: 'ltr' | null
  children: Array<LexicalTextNode | LexicalElement>
  [key: string]: unknown
}

export type LexicalState = {
  root: LexicalElement
}

function textNode(text: string): LexicalTextNode {
  return {
    type: 'text',
    text,
    format: 0,
    detail: 0,
    mode: 'normal',
    style: '',
    version: 1,
  }
}

function paragraph(text: string): LexicalElement {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    children: text ? [textNode(text)] : [],
    direction: 'ltr',
    textFormat: 0,
    textStyle: '',
  }
}

function listItem(text: string, value: number): LexicalElement {
  return {
    type: 'listitem',
    format: '',
    indent: 0,
    version: 1,
    value,
    children: [textNode(text)],
    direction: 'ltr',
  }
}

function bulletList(items: string[]): LexicalElement {
  return {
    type: 'list',
    listType: 'bullet',
    start: 1,
    tag: 'ul',
    format: '',
    indent: 0,
    version: 1,
    children: items.map((item, i) => listItem(item, i + 1)),
    direction: 'ltr',
  }
}

/** Convert pack text (paragraphs + `- ` bullets) to Lexical JSON. */
export function textToLexical(raw: string): LexicalState {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  const children: LexicalElement[] = []
  let bullets: string[] = []
  let para: string[] = []

  const flushBullets = () => {
    if (!bullets.length) return
    children.push(bulletList(bullets))
    bullets = []
  }

  const flushPara = () => {
    if (!para.length) return
    children.push(paragraph(para.join(' ').trim()))
    para = []
  }

  for (const line of lines) {
    const t = line.trim()
    if (!t) {
      flushBullets()
      flushPara()
      continue
    }
    if (t.startsWith('- ') || t.startsWith('* ')) {
      flushPara()
      bullets.push(t.slice(2).trim())
      continue
    }
    flushBullets()
    para.push(t)
  }
  flushBullets()
  flushPara()

  if (!children.length) {
    children.push(paragraph(''))
  }

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children,
      direction: 'ltr',
    },
  }
}
