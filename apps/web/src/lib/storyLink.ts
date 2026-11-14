import { mediaUrl, type Issue, type IssueSection, type Lang, type MediaDoc } from './payload'

export function storyLinkLabel(lang: Lang): string {
  return lang === 'te' ? 'ఇంకా చదవండి →' : 'Read more →'
}

export function storyBackLabel(lang: Lang): string {
  return lang === 'te' ? '← న్యూస్‌లెటర్‌కి తిరిగి' : '← Back to newsletter'
}

export function normalizeStoryUrl(url?: string | null): string | null {
  const trimmed = (url || '').trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function pickLangText(
  lang: Lang,
  te?: string | null,
  en?: string | null,
): string {
  return ((lang === 'te' ? te : en) || '').trim()
}

export function itemKeyAt(id: string | null | undefined, index: number): string {
  const trimmed = (id || '').trim()
  return trimmed || `i-${index}`
}

export function storyAnchorId(sectionKey: string, itemKey: string): string {
  return `story-${sectionKey}-${itemKey}`
}

export function internalStoryPath(
  month: string,
  lang: Lang,
  sectionKey: string,
  itemKey: string,
): string {
  return `/issues/${month}/${lang}/story/${encodeURIComponent(sectionKey)}/${encodeURIComponent(itemKey)}/`
}

export function newsletterReturnHref(
  month: string,
  lang: Lang,
  sectionKey: string,
  itemKey: string,
  view: 'news' | 'print' | 'flip' = 'news',
): string {
  const anchor = storyAnchorId(sectionKey, itemKey)
  if (view === 'print') {
    return `/issues/${month}/${lang}/?view=print#${anchor}`
  }
  if (view === 'flip') {
    return `/issues/${month}/${lang}/?view=flip#${anchor}`
  }
  // News: reopen the in-page drawer on return
  return `/issues/${month}/${lang}/?view=news&story=${encodeURIComponent(anchor)}#${anchor}`
}

export type ResolvedStoryLink = {
  href: string | null
  external: boolean
  anchorId: string
}

/** Prefer in-site full story; fall back to optional external URL. */
export function resolveStoryLink(opts: {
  month: string
  lang: Lang
  sectionKey: string
  itemKey: string
  fullStory?: string | null
  storyUrl?: string | null
  from?: 'news' | 'print' | 'flip'
}): ResolvedStoryLink {
  const anchorId = storyAnchorId(opts.sectionKey, opts.itemKey)
  if ((opts.fullStory || '').trim()) {
    const path = internalStoryPath(opts.month, opts.lang, opts.sectionKey, opts.itemKey)
    const href =
      opts.from && opts.from !== 'news' ? `${path}?from=${opts.from}` : path
    return { href, external: false, anchorId }
  }
  const external = normalizeStoryUrl(opts.storyUrl)
  return { href: external, external: Boolean(external), anchorId }
}

export type ShortListItem = {
  title: string
  body: string
  meta?: string
  itemKey: string
  sectionKey: string
  anchorId: string
  href: string | null
  external: boolean
  fullStory: string
  imageSrc?: string | null
  imageAlt?: string | null
  imageSrcs?: { src: string; alt: string }[]
}

type Linkable = {
  id?: string
  storyUrl?: string | null
  fullStoryTe?: string | null
  fullStoryEn?: string | null
  image?: MediaDoc | number | string | null
  images?: { id?: string; image?: MediaDoc | number | string | null }[] | null
}

/** Primary + gallery stills for a theme (or other) item. */
export function collectItemImages(
  item: Linkable,
  fallbackAlt = '',
): { imageSrc: string | null; imageAlt: string; imageSrcs: { src: string; alt: string }[] } {
  const seen = new Set<string>()
  const imageSrcs: { src: string; alt: string }[] = []

  const push = (media: MediaDoc | number | string | null | undefined) => {
    const src = mediaUrl(media)
    if (!src || seen.has(src)) return
    seen.add(src)
    const alt =
      (typeof media === 'object' && media && 'alt' in media ? media.alt : '') ||
      fallbackAlt ||
      ''
    imageSrcs.push({ src, alt: alt || '' })
  }

  push(item.image)
  for (const row of item.images || []) {
    push(row?.image)
  }

  const primary = imageSrcs[0]
  return {
    imageSrc: primary?.src || null,
    imageAlt: primary?.alt || fallbackAlt || '',
    imageSrcs,
  }
}

function toShortItem(opts: {
  month: string
  lang: Lang
  sectionKey: string
  index: number
  item: Linkable
  title: string
  body: string
  meta?: string
  from?: 'news' | 'print' | 'flip'
}): ShortListItem | null {
  const itemKey = itemKeyAt(opts.item.id, opts.index)
  const fullStory = pickLangText(opts.lang, opts.item.fullStoryTe, opts.item.fullStoryEn)
  const link = resolveStoryLink({
    month: opts.month,
    lang: opts.lang,
    sectionKey: opts.sectionKey,
    itemKey,
    fullStory,
    storyUrl: opts.item.storyUrl,
    from: opts.from,
  })
  if (!opts.title && !opts.body && !opts.meta && !link.href) return null
  const { imageSrc, imageAlt, imageSrcs } = collectItemImages(opts.item, opts.title)
  return {
    title: opts.title,
    body: opts.body,
    meta: opts.meta,
    itemKey,
    sectionKey: opts.sectionKey,
    anchorId: link.anchorId,
    href: link.href,
    external: link.external,
    fullStory,
    imageSrc,
    imageAlt,
    imageSrcs,
  }
}

/** Structured short items for News / Flip (and shared helpers). */
export function shortItemsForSection(
  section: IssueSection,
  lang: Lang,
  month: string,
  from: 'news' | 'print' | 'flip' = 'news',
): ShortListItem[] {
  const key = section.key

  if (key === 'themes') {
    return (section.themeItems || [])
      .map((item, index) =>
        toShortItem({
          month,
          lang,
          sectionKey: key,
          index,
          item,
          title: pickLangText(lang, item.titleTe, item.titleEn),
          body: pickLangText(lang, item.blurbTe, item.blurbEn),
          from,
        }),
      )
      .filter(Boolean) as ShortListItem[]
  }

  if (key === 'highlight-classes') {
    return (section.classItems || [])
      .map((item, index) =>
        toShortItem({
          month,
          lang,
          sectionKey: key,
          index,
          item,
          title: pickLangText(lang, item.titleTe, item.titleEn),
          body: pickLangText(lang, item.insightTe, item.insightEn),
          meta: [item.speaker, item.date].filter(Boolean).join(' · '),
          from,
        }),
      )
      .filter(Boolean) as ShortListItem[]
  }

  if (key === 'experiences') {
    return (section.stories || [])
      .map((item, index) =>
        toShortItem({
          month,
          lang,
          sectionKey: key,
          index,
          item,
          title: [item.name, item.location].filter(Boolean).join(' / '),
          body: pickLangText(lang, item.bodyTe, item.bodyEn),
          from,
        }),
      )
      .filter(Boolean) as ShortListItem[]
  }

  if (key === 'visits') {
    return (section.visitItems || [])
      .map((item, index) =>
        toShortItem({
          month,
          lang,
          sectionKey: key,
          index,
          item,
          title: [item.date, item.place].filter(Boolean).join(' / '),
          body: pickLangText(lang, item.noteTe, item.noteEn),
          from,
        }),
      )
      .filter(Boolean) as ShortListItem[]
  }

  if (key === 'vanya') {
    return (section.featureItems || [])
      .map((item, index) =>
        toShortItem({
          month,
          lang,
          sectionKey: key,
          index,
          item,
          title: pickLangText(lang, item.titleTe, item.titleEn),
          body: pickLangText(lang, item.bodyTe, item.bodyEn),
          from,
        }),
      )
      .filter(Boolean) as ShortListItem[]
  }

  if (key === 'campus') {
    const campuses: Array<{
      itemKey: string
      title: string
      body: string
      fullStory: string
      storyUrl?: string | null
    }> = [
      {
        itemKey: 'goloka',
        title: 'Goloka',
        body: pickLangText(lang, section.golokaTe, section.golokaEn),
        fullStory: pickLangText(lang, section.golokaFullStoryTe, section.golokaFullStoryEn),
        storyUrl: section.golokaUrl,
      },
      {
        itemKey: 'sahasrara',
        title: 'Sahasrara',
        body: pickLangText(lang, section.sahasraraTe, section.sahasraraEn),
        fullStory: pickLangText(lang, section.sahasraraFullStoryTe, section.sahasraraFullStoryEn),
        storyUrl: section.sahasraraUrl,
      },
      {
        itemKey: 'qlu',
        title: 'QLU',
        body: pickLangText(lang, section.qluTe, section.qluEn),
        fullStory: pickLangText(lang, section.qluFullStoryTe, section.qluFullStoryEn),
        storyUrl: section.qluUrl,
      },
    ]

    return campuses
      .map((c) => {
        const link = resolveStoryLink({
          month,
          lang,
          sectionKey: key,
          itemKey: c.itemKey,
          fullStory: c.fullStory,
          storyUrl: c.storyUrl,
          from,
        })
        if (!c.body && !link.href) return null
        return {
          title: c.title,
          body: c.body,
          itemKey: c.itemKey,
          sectionKey: key,
          anchorId: link.anchorId,
          href: link.href,
          external: link.external,
          fullStory: c.fullStory,
        } satisfies ShortListItem
      })
      .filter(Boolean) as ShortListItem[]
  }

  if (key === 'upcoming') {
    return (section.eventItems || [])
      .map((item, index) => {
        const venue = pickLangText(lang, item.venueTe, item.venueEn)
        return toShortItem({
          month,
          lang,
          sectionKey: key,
          index,
          item,
          title: pickLangText(lang, item.titleTe, item.titleEn),
          body: pickLangText(lang, item.detailsTe, item.detailsEn),
          meta: [item.when, venue].filter(Boolean).join(' · '),
          from,
        })
      })
      .filter(Boolean) as ShortListItem[]
  }

  return []
}

export type ResolvedFullStory = {
  title: string
  meta?: string
  blurb: string
  fullStory: string
  sectionKey: string
  itemKey: string
  imageSrc?: string | null
  imageAlt?: string | null
  imageSrcs?: { src: string; alt: string }[]
}

function matchArrayItem<T extends { id?: string }>(
  items: T[] | null | undefined,
  itemKey: string,
): { item: T; index: number } | null {
  const list = items || []
  const byId = list.findIndex((item) => (item.id || '').trim() === itemKey)
  if (byId >= 0) return { item: list[byId]!, index: byId }
  const m = /^i-(\d+)$/.exec(itemKey)
  if (m) {
    const index = Number(m[1])
    if (list[index]) return { item: list[index]!, index }
  }
  return null
}

/** Resolve in-site full story for the detail page. */
export function findFullStory(
  issue: Issue,
  sectionKey: string,
  itemKey: string,
  lang: Lang,
): ResolvedFullStory | null {
  // Multiple rows can share a key (e.g. two Themes series). Search all of them.
  const sections = (issue.sections || []).filter((s) => s.key === sectionKey)
  if (!sections.length) return null

  if (sectionKey === 'campus') {
    const section = sections[0]!
    const map: Record<
      string,
      {
        title: string
        blurb: string
        fullStory: string
      }
    > = {
      goloka: {
        title: 'Goloka',
        blurb: pickLangText(lang, section.golokaTe, section.golokaEn),
        fullStory: pickLangText(lang, section.golokaFullStoryTe, section.golokaFullStoryEn),
      },
      sahasrara: {
        title: 'Sahasrara',
        blurb: pickLangText(lang, section.sahasraraTe, section.sahasraraEn),
        fullStory: pickLangText(lang, section.sahasraraFullStoryTe, section.sahasraraFullStoryEn),
      },
      qlu: {
        title: 'QLU',
        blurb: pickLangText(lang, section.qluTe, section.qluEn),
        fullStory: pickLangText(lang, section.qluFullStoryTe, section.qluFullStoryEn),
      },
    }
    const hit = map[itemKey]
    if (!hit?.fullStory) return null
    return {
      title: hit.title,
      blurb: hit.blurb,
      fullStory: hit.fullStory,
      sectionKey,
      itemKey,
    }
  }

  for (const section of sections) {
    if (sectionKey === 'themes') {
      const hit = matchArrayItem(section.themeItems, itemKey)
      if (!hit) continue
      const fullStory = pickLangText(lang, hit.item.fullStoryTe, hit.item.fullStoryEn)
      if (!fullStory) continue
      const title = pickLangText(lang, hit.item.titleTe, hit.item.titleEn)
      const { imageSrc, imageAlt, imageSrcs } = collectItemImages(hit.item, title)
      return {
        title,
        blurb: pickLangText(lang, hit.item.blurbTe, hit.item.blurbEn),
        fullStory,
        sectionKey,
        itemKey: itemKeyAt(hit.item.id, hit.index),
        imageSrc,
        imageAlt,
        imageSrcs,
      }
    }

    if (sectionKey === 'highlight-classes') {
      const hit = matchArrayItem(section.classItems, itemKey)
      if (!hit) continue
      const fullStory = pickLangText(lang, hit.item.fullStoryTe, hit.item.fullStoryEn)
      if (!fullStory) continue
      return {
        title: pickLangText(lang, hit.item.titleTe, hit.item.titleEn),
        meta: [hit.item.speaker, hit.item.date].filter(Boolean).join(' · '),
        blurb: pickLangText(lang, hit.item.insightTe, hit.item.insightEn),
        fullStory,
        sectionKey,
        itemKey: itemKeyAt(hit.item.id, hit.index),
      }
    }

    if (sectionKey === 'experiences') {
      const hit = matchArrayItem(section.stories, itemKey)
      if (!hit) continue
      const fullStory = pickLangText(lang, hit.item.fullStoryTe, hit.item.fullStoryEn)
      if (!fullStory) continue
      return {
        title: [hit.item.name, hit.item.location].filter(Boolean).join(' / '),
        blurb: pickLangText(lang, hit.item.bodyTe, hit.item.bodyEn),
        fullStory,
        sectionKey,
        itemKey: itemKeyAt(hit.item.id, hit.index),
      }
    }

    if (sectionKey === 'visits') {
      const hit = matchArrayItem(section.visitItems, itemKey)
      if (!hit) continue
      const fullStory = pickLangText(lang, hit.item.fullStoryTe, hit.item.fullStoryEn)
      if (!fullStory) continue
      return {
        title: [hit.item.date, hit.item.place].filter(Boolean).join(' / '),
        blurb: pickLangText(lang, hit.item.noteTe, hit.item.noteEn),
        fullStory,
        sectionKey,
        itemKey: itemKeyAt(hit.item.id, hit.index),
      }
    }

    if (sectionKey === 'vanya') {
      const hit = matchArrayItem(section.featureItems, itemKey)
      if (!hit) continue
      const fullStory = pickLangText(lang, hit.item.fullStoryTe, hit.item.fullStoryEn)
      if (!fullStory) continue
      return {
        title: pickLangText(lang, hit.item.titleTe, hit.item.titleEn),
        blurb: pickLangText(lang, hit.item.bodyTe, hit.item.bodyEn),
        fullStory,
        sectionKey,
        itemKey: itemKeyAt(hit.item.id, hit.index),
      }
    }

    if (sectionKey === 'upcoming') {
      const hit = matchArrayItem(section.eventItems, itemKey)
      if (!hit) continue
      const fullStory = pickLangText(lang, hit.item.fullStoryTe, hit.item.fullStoryEn)
      if (!fullStory) continue
      const venue = pickLangText(lang, hit.item.venueTe, hit.item.venueEn)
      return {
        title: pickLangText(lang, hit.item.titleTe, hit.item.titleEn),
        meta: [hit.item.when, venue].filter(Boolean).join(' · '),
        blurb: pickLangText(lang, hit.item.detailsTe, hit.item.detailsEn),
        fullStory,
        sectionKey,
        itemKey: itemKeyAt(hit.item.id, hit.index),
      }
    }
  }

  return null
}
