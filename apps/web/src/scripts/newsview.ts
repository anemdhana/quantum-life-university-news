/** News river reader: chrome select, scroll-spy, progress, story drawer. */

function chapterIdForEl(el: HTMLElement | null): string | null {
  const section = el?.closest<HTMLElement>('[data-news-section]')
  return section?.id || null
}

function storyParamFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search)
  const raw = (params.get('story') || '').trim()
  return raw || null
}

function urlWithStory(storyId: string | null): string {
  const url = new URL(window.location.href)
  if (storyId) url.searchParams.set('story', storyId)
  else url.searchParams.delete('story')
  return `${url.pathname}${url.search}${url.hash}`
}

export function initNewsView(root: HTMLElement) {
  const scroller = root.querySelector<HTMLElement>('.nr__scroll')
  const selects = [...root.querySelectorAll<HTMLSelectElement>('[data-news-section-select]')]
  const progress = root.querySelector<HTMLElement>('[data-news-progress]')
  const heading = root.querySelector<HTMLElement>('[data-news-heading]')
  const drawer = root.querySelector<HTMLElement>('[data-story-drawer]')
  const drawerMount = root.querySelector<HTMLElement>('[data-story-drawer-mount]')
  const drawerHeading = root.querySelector<HTMLElement>('#nr-drawer-heading')
  if (drawerHeading && !drawerHeading.dataset.default) {
    drawerHeading.dataset.default = drawerHeading.textContent || ''
  }

  const sectionEls = [...root.querySelectorAll<HTMLElement>('[data-news-section]')]
  const uniqueSections = sectionEls
    .filter((el) => el.id)
    .map((el) => ({
      id: el.id,
      el,
      label: el.dataset.newsLabel || el.querySelector('h2')?.textContent || el.id,
    }))

  let drawerOpenId: string | null = null
  let lastFocus: HTMLElement | null = null
  let skipPush = false

  const setActive = (id: string) => {
    const match = uniqueSections.find((s) => s.id === id)
    if (!match) return

    selects.forEach((sel) => {
      if (sel.value !== id) sel.value = id
    })

    if (heading) {
      heading.textContent = match.label
    }
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
  }

  const closeDrawer = (opts?: { history?: boolean }) => {
    if (!drawer || !drawerMount) return
    const wasOpen = drawer.classList.contains('is-open')
    drawer.classList.remove('is-open')
    drawer.setAttribute('aria-hidden', 'true')
    root.classList.remove('nr--drawer-open')
    drawerMount.replaceChildren()
    drawerOpenId = null

    if (wasOpen && opts?.history !== false && !skipPush) {
      const url = urlWithStory(null)
      history.pushState({ storyDrawer: null }, '', url)
    }
    skipPush = false

    // Restore focus without scrolling the newsletter underneath
    lastFocus?.focus?.({ preventScroll: true })
    lastFocus = null
  }

  const openDrawer = (storyId: string, opts?: { history?: boolean; focus?: HTMLElement | null }) => {
    if (!drawer || !drawerMount) return
    const source = root.querySelector<HTMLElement>(
      `[data-story-source="${storyId.replace(/"/g, '')}"]`,
    )
    if (!source) return

    const titleEl = source.querySelector('.story-reader__title')
    if (drawerHeading) {
      drawerHeading.textContent =
        titleEl?.textContent?.trim() || drawerHeading.dataset.default || ''
    }

    drawerMount.replaceChildren()
    const clone = source.firstElementChild?.cloneNode(true)
    if (clone) drawerMount.appendChild(clone)

    lastFocus = opts?.focus || (document.activeElement as HTMLElement | null)
    drawerOpenId = storyId
    drawer.classList.add('is-open')
    drawer.setAttribute('aria-hidden', 'false')
    root.classList.add('nr--drawer-open')

    const backBtn = drawer.querySelector<HTMLButtonElement>('.nr-drawer__back')
    requestAnimationFrame(() => backBtn?.focus({ preventScroll: true }))

    const card = root.querySelector<HTMLElement>(`#${CSS.escape(storyId)}`)
    const chapterId = chapterIdForEl(card)
    if (chapterId) setActive(chapterId)

    if (opts?.history !== false) {
      const url = urlWithStory(storyId)
      if (storyParamFromUrl() !== storyId) {
        history.pushState({ storyDrawer: storyId }, '', url)
      } else {
        history.replaceState({ storyDrawer: storyId }, '', url)
      }
    }

    const scrollPane = drawer.querySelector<HTMLElement>('.nr-drawer__scroll')
    if (scrollPane) scrollPane.scrollTop = 0
  }

  const restoreStoryAnchor = () => {
    const id = decodeURIComponent((window.location.hash || '').replace(/^#/, ''))
    if (!id.startsWith('story-')) return false
    const target = root.querySelector<HTMLElement>(`#${CSS.escape(id)}`)
    if (!target || !scroller) return false

    const chapterId = chapterIdForEl(target)
    const top = Math.max(0, target.offsetTop - 24)

    if (chapterId) setActive(chapterId)

    requestAnimationFrame(() => {
      scroller.scrollTo({ top, behavior: 'smooth' })
      if (chapterId) {
        window.setTimeout(() => setActive(chapterId), 320)
      }
    })
    return true
  }

  selects.forEach((sel) => {
    sel.addEventListener('change', () => {
      const id = sel.value
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

  root.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null
    const closeEl = target?.closest<HTMLElement>('[data-story-drawer-close]')
    if (closeEl && drawer?.contains(closeEl)) {
      e.preventDefault()
      closeDrawer()
      return
    }

    const openLink = target?.closest<HTMLAnchorElement>('a[data-story-drawer-open]')
    if (!openLink || !root.contains(openLink)) return
    if (e.defaultPrevented) return
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

    const storyId = openLink.getAttribute('data-story-drawer-open')
    if (!storyId) return
    e.preventDefault()
    openDrawer(storyId, { focus: openLink })
  })

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return
    if (!drawer?.classList.contains('is-open')) return
    e.preventDefault()
    closeDrawer()
  })

  window.addEventListener('popstate', () => {
    const id = storyParamFromUrl()
    skipPush = true
    if (id && root.querySelector(`[data-story-source="${id.replace(/"/g, '')}"]`)) {
      openDrawer(id, { history: false })
    } else if (drawer?.classList.contains('is-open')) {
      closeDrawer({ history: false })
    }
    skipPush = false
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
  const storyQ = storyParamFromUrl()

  if (storyQ && root.querySelector(`[data-story-source="${storyQ.replace(/"/g, '')}"]`)) {
    suppressObserverUntil = Date.now() + 500
    restoreStoryAnchor()
    requestAnimationFrame(() => openDrawer(storyQ, { history: false }))
  } else if (hash.startsWith('story-')) {
    suppressObserverUntil = Date.now() + 500
    if (!restoreStoryAnchor() && uniqueSections[0]) setActive(uniqueSections[0].id)
  } else if (hash && uniqueSections.some((s) => s.id === hash)) {
    requestAnimationFrame(() => scrollToId(hash))
  } else if (uniqueSections[0]) {
    setActive(uniqueSections[0].id)
  }
}
