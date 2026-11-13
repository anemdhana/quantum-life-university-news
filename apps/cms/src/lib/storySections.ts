export type StorySection = {
  title: string
  body: string
}

/** Split story Markdown on `### ` headings (publication subsection style). */
export function markdownToSections(md: string | null | undefined): StorySection[] {
  const raw = (md || '').replace(/\r\n/g, '\n').trim()
  if (!raw) return []

  if (!/^###\s+/m.test(raw)) {
    return [{ title: 'Story', body: raw }]
  }

  const parts = raw.split(/^###\s+/m)
  const sections: StorySection[] = []
  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i]
    const nl = chunk.indexOf('\n')
    const title = (nl < 0 ? chunk : chunk.slice(0, nl)).trim()
    const body = (nl < 0 ? '' : chunk.slice(nl + 1)).trim()
    if (!title && !body) continue
    sections.push({ title: title || `Section ${sections.length + 1}`, body })
  }
  return sections
}

export function sectionsToMarkdown(sections: StorySection[]): string {
  return sections
    .map((s) => {
      const title = (s.title || '').trim() || 'Section'
      const body = (s.body || '').trim()
      return body ? `### ${title}\n\n${body}` : `### ${title}`
    })
    .join('\n\n')
}
