import type { IssueSection, Lang } from './payload'

export function storyLinkLabel(lang: Lang): string {
  return lang === 'te' ? 'పూర్తి కథ' : 'Read full story'
}

export function normalizeStoryUrl(url?: string | null): string | null {
  const trimmed = (url || '').trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export type ShortListItem = {
  title: string
  body: string
  meta?: string
  storyUrl: string | null
}

/** Structured short items for News / Flip (and shared helpers). */
export function shortItemsForSection(section: IssueSection, lang: Lang): ShortListItem[] {
  const key = section.key

  if (key === 'themes') {
    return (section.themeItems || [])
      .map((item) => {
        const title = ((lang === 'te' ? item.titleTe : item.titleEn) || '').trim()
        const body = ((lang === 'te' ? item.blurbTe : item.blurbEn) || '').trim()
        const storyUrl = normalizeStoryUrl(item.storyUrl)
        if (!title && !body && !storyUrl) return null
        return { title, body, storyUrl }
      })
      .filter(Boolean) as ShortListItem[]
  }

  if (key === 'highlight-classes') {
    return (section.classItems || [])
      .map((item) => {
        const title = ((lang === 'te' ? item.titleTe : item.titleEn) || '').trim()
        const body = ((lang === 'te' ? item.insightTe : item.insightEn) || '').trim()
        const meta = [item.speaker, item.date].filter(Boolean).join(' · ')
        const storyUrl = normalizeStoryUrl(item.storyUrl)
        if (!title && !body && !meta && !storyUrl) return null
        return { title, body, meta, storyUrl }
      })
      .filter(Boolean) as ShortListItem[]
  }

  if (key === 'experiences') {
    return (section.stories || [])
      .map((item) => {
        const title = [item.name, item.location].filter(Boolean).join(' / ')
        const body = ((lang === 'te' ? item.bodyTe : item.bodyEn) || '').trim()
        const storyUrl = normalizeStoryUrl(item.storyUrl)
        if (!title && !body && !storyUrl) return null
        return { title, body, storyUrl }
      })
      .filter(Boolean) as ShortListItem[]
  }

  if (key === 'visits') {
    return (section.visitItems || [])
      .map((item) => {
        const title = [item.date, item.place].filter(Boolean).join(' / ')
        const body = ((lang === 'te' ? item.noteTe : item.noteEn) || '').trim()
        const storyUrl = normalizeStoryUrl(item.storyUrl)
        if (!title && !body && !storyUrl) return null
        return { title, body, storyUrl }
      })
      .filter(Boolean) as ShortListItem[]
  }

  if (key === 'vanya') {
    return (section.featureItems || [])
      .map((item) => {
        const title = ((lang === 'te' ? item.titleTe : item.titleEn) || '').trim()
        const body = ((lang === 'te' ? item.bodyTe : item.bodyEn) || '').trim()
        const storyUrl = normalizeStoryUrl(item.storyUrl)
        if (!title && !body && !storyUrl) return null
        return { title, body, storyUrl }
      })
      .filter(Boolean) as ShortListItem[]
  }

  if (key === 'campus') {
    return [
      {
        title: 'Goloka',
        body: ((lang === 'te' ? section.golokaTe : section.golokaEn) || '').trim(),
        storyUrl: normalizeStoryUrl(section.golokaUrl),
      },
      {
        title: 'Sahasrara',
        body: ((lang === 'te' ? section.sahasraraTe : section.sahasraraEn) || '').trim(),
        storyUrl: normalizeStoryUrl(section.sahasraraUrl),
      },
      {
        title: 'QLU',
        body: ((lang === 'te' ? section.qluTe : section.qluEn) || '').trim(),
        storyUrl: normalizeStoryUrl(section.qluUrl),
      },
    ].filter((b) => b.body || b.storyUrl)
  }

  if (key === 'upcoming') {
    return (section.eventItems || [])
      .map((item) => {
        const title = ((lang === 'te' ? item.titleTe : item.titleEn) || '').trim()
        const venue = ((lang === 'te' ? item.venueTe : item.venueEn) || '').trim()
        const details = ((lang === 'te' ? item.detailsTe : item.detailsEn) || '').trim()
        const meta = [item.when, venue].filter(Boolean).join(' · ')
        const storyUrl = normalizeStoryUrl(item.storyUrl)
        if (!title && !details && !meta && !storyUrl) return null
        return { title, body: details, meta, storyUrl }
      })
      .filter(Boolean) as ShortListItem[]
  }

  return []
}
