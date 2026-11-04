import {
  convertMarkdownToLexical,
  editorConfigFactory,
} from '@payloadcms/richtext-lexical'
import type { PayloadRequest } from 'payload'

type SectionRow = {
  bodyTeMd?: string | null
  bodyEnMd?: string | null
  bodyTe?: unknown
  bodyEn?: unknown
  [key: string]: unknown
}

/** Paste-only Markdown boxes → Lexical bodies; MD fields are not persisted. */
export async function applyMarkdownPasteToSections(
  data: { sections?: SectionRow[] | null } | undefined | null,
  req: PayloadRequest,
): Promise<void> {
  const sections = data?.sections
  if (!Array.isArray(sections) || !sections.length) return

  const needsConvert = sections.some(
    (s) => Boolean(s?.bodyTeMd?.trim()) || Boolean(s?.bodyEnMd?.trim()),
  )
  if (!needsConvert) {
    for (const s of sections) {
      delete s.bodyTeMd
      delete s.bodyEnMd
    }
    return
  }

  const editorConfig = await editorConfigFactory.default({
    config: req.payload.config,
  })

  for (const section of sections) {
    const teMd = section.bodyTeMd?.trim()
    if (teMd) {
      section.bodyTe = convertMarkdownToLexical({
        editorConfig,
        markdown: teMd,
      })
    }
    const enMd = section.bodyEnMd?.trim()
    if (enMd) {
      section.bodyEn = convertMarkdownToLexical({
        editorConfig,
        markdown: enMd,
      })
    }
    delete section.bodyTeMd
    delete section.bodyEnMd
  }
}
