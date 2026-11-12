/** News river reader: left-nav scroll-spy + progress + mobile drawer. */

function chapterIdForEl(el: HTMLElement | null): string | null {
  const section = el?.closest<HTMLElement>('[data-news-section]')
  return section?.id || null
}

export function initNewsView(root: HTMLElement) {
  const scroller = root.querySelector<HTMLElement>('.nr__scroll')
  const tocRoots = [
    root.querySelector<HTMLElement>('[data-news-toc]'),
    root.querySelector<HTMLElement>('[data-news-mobile-nav]'),
  ].filter(Boolean) as HTMLElement[]
  const links = [...root.querySelectorAll<HTMLElement>('[data-news-toc-link]')]
  const progress = root.querySelector<HTMLElement>('[data-news-progress]')
  const heading = root.querySelector<HTMLElement>('[data-news-heading]')
  const menuBtn = root.querySelector<HTMLButtonElement>('[data-news-menu]')
  const mobileSide = root.querySelector<HTMLElement>('[data-news-mobile-side]')

  const sections = links
    .map((link) => {
      const id = link.getAttribute('data-target') || ''
      const el = id ? root.querySelector<HTMLElement>(`#${CSS.escape(id)}`) : null
      return el ? { id, el, link } : null
    })
    .filter(Boolean) as { id: string; el: HTMLElement; link: HTMLElement }[]

  // Deduplicate by section id (desktop + mobile nav share targets)
  const uniqueSections = [...new Map(sections.map((s) => [s.id, s])).values()]

  const setActive = (id: string) => {
    const match = uniqueSections.find((s) => s.id === id)
    if (!match) return
    links.forEach((link) => {
      const active = link.getAttribute('data-target') === id
      link.classList.toggle('is-active', active)
      if (active) link.setAttribute('aria-current', 'true')
      else link.removeAttribute('aria-current')
    })
    if (heading) {
      heading.textContent =
        match.el.dataset.newsLabel || match.el.querySelector('h2')?.textContent || ''
    }
    tocRoots.forEach((nav) => {
      const activeBtn = [...nav.querySelectorAll<HTMLElement>('[data-news-toc-link]')].find(
        (el) => el.getAttribute('data-target') === id,
      )
      if (!activeBtn) return
      const top = activeBtn.offsetTop - nav.clientHeight / 2 + activeBtn.clientHeight / 2
      nav.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
    })
  }

  const scrollToId = (id: string) => {
    const target = root.querySelector<HTMLElement>(`#${CSS.escape(id)}`)
    if (!target || !scroller) return
    scroller.scrollTo({
      top: Math.max(0, target.offsetTop - 8),
      behavior: 'smooth',
    })
    history.replaceState(null, '', `#${id}`)
    setActive(id)
    mobileSide?.classList.remove('is-open')
    menuBtn?.setAttribute('aria-expanded', 'false')
  }

  const restoreStoryAnchor = () => {
    const id = decodeURIComponent((window.location.hash || '').replace(/^#/, ''))
    if (!id.startsWith('story-')) return false
    const target = root.querySelector<HTMLElement>(`#${CSS.escape(id)}`)
    if (!target || !scroller) return false

    const chapterId = chapterIdForEl(target)
    const top = Math.max(0, target.offsetTop - 24)

    // Highlight the chapter that owns this story card immediately.
    if (chapterId) setActive(chapterId)

    requestAnimationFrame(() => {
      scroller.scrollTo({ top, behavior: 'smooth' })
      // Re-assert after layout/scroll settle (observer can briefly fight).
      if (chapterId) {
        window.setTimeout(() => setActive(chapterId), 320)
      }
    })
    return true
  }

  links.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      const id = link.getAttribute('data-target')
      if (id) scrollToId(id)
    })
  })

  root.querySelectorAll<HTMLAnchorElement>('a.nr__begin').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href')?.replace(/^#/, '')
      if (!id) return
      e.preventDefault()
      scrollToId(id)
    })
  })

  menuBtn?.addEventListener('click', () => {
    const open = mobileSide?.classList.toggle('is-open')
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false')
  })

  let suppressObserverUntil = 0
  if (scroller && uniqueSections.length && 'IntersectionObserver' in window) {
    const visible = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id
          if (!id) continue
          if (entry.isIntersecting) visible.set(id, entry.intersectionRatio)
          else visible.delete(id)
        }
        if (Date.now() < suppressObserverUntil) return
        let bestId = uniqueSections[0]!.id
        let bestRatio = -1
        for (const { id } of uniqueSections) {
          const ratio = visible.get(id) || 0
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestId = id
          }
        }
        if (bestRatio > 0) setActive(bestId)
      },
      {
        root: scroller,
        rootMargin: '-12% 0px -62% 0px',
        threshold: [0.05, 0.15, 0.35, 0.55],
      },
    )
    uniqueSections.forEach(({ el }) => observer.observe(el))
  }

  const onScrollProgress = () => {
    if (!progress || !scroller) return
    const max = Math.max(1, scroller.scrollHeight - scroller.clientHeight)
    const pct = Math.min(100, Math.max(2, (scroller.scrollTop / max) * 100))
    progress.style.width = `${pct}%`
  }
  scroller?.addEventListener('scroll', onScrollProgress, { passive: true })
  onScrollProgress()

  const hash = decodeURIComponent((window.location.hash || '').replace(/^#/, ''))
  if (hash.startsWith('story-')) {
    suppressObserverUntil = Date.now() + 500
    if (!restoreStoryAnchor() && uniqueSections[0]) setActive(uniqueSections[0].id)
  } else if (hash && uniqueSections.some((s) => s.id === hash)) {
    requestAnimationFrame(() => scrollToId(hash))
  } else if (uniqueSections[0]) {
    setActive(uniqueSections[0].id)
  }
}
