/** Sectioned column reader — sidebar chapters, spreads, keyboard, font size. */

type Chapter = {
  title: string
  paras: string[]
  minutes: number
}

export function initJnanaReader(root: HTMLElement) {
  const payload = root.querySelector<HTMLScriptElement>(
    'script[type="application/json"][data-jnana-chapters]',
  )
  const raw = payload?.textContent?.trim()
  if (!raw) return

  let chapters: Chapter[] = []
  try {
    chapters = JSON.parse(raw) as Chapter[]
  } catch {
    return
  }
  if (!chapters.length) return

  const nav = root.querySelector<HTMLElement>('[data-jnana-nav]')
  const mobileNav = root.querySelector<HTMLElement>('[data-jnana-mobile-nav]')
  const columns = root.querySelector<HTMLElement>('[data-jnana-columns]')
  const heading = root.querySelector<HTMLElement>('[data-jnana-heading]')
  const timeEl = root.querySelector<HTMLElement>('[data-jnana-time]')
  const position = root.querySelector<HTMLElement>('[data-jnana-position]')
  const prevBtn = root.querySelector<HTMLButtonElement>('[data-jnana-prev]')
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-jnana-next]')
  const fontBtn = root.querySelector<HTMLButtonElement>('[data-jnana-font]')
  const menuBtn = root.querySelector<HTMLButtonElement>('[data-jnana-menu]')
  const mobileSide = root.querySelector<HTMLElement>('[data-jnana-mobile-side]')
  const progress = root.querySelector<HTMLElement>('[data-jnana-progress]')
  const endLink = root.querySelector<HTMLAnchorElement>('[data-jnana-end-link]')

  if (!columns || !nav) return

  let chapter = 0
  let spreadIndex = 0
  let spreadCount = 1
  let pageStride = 1

  function makeNav(target: HTMLElement | null) {
    if (!target) return
    target.innerHTML = ''
    chapters.forEach((c, i) => {
      const li = document.createElement('li')
      const b = document.createElement('button')
      b.type = 'button'
      b.innerHTML = `<span class="jnana-r__n">${String(i + 1).padStart(2, '0')}</span><span class="jnana-r__nav-copy">${escapeHtml(c.title)}<small>~${c.minutes} min</small></span>`
      b.addEventListener('click', () => {
        chapter = i
        spreadIndex = 0
        render()
        mobileSide?.classList.remove('is-open')
        menuBtn?.setAttribute('aria-expanded', 'false')
      })
      li.append(b)
      target.append(li)
    })
  }

  function escapeHtml(s: string) {
    return s
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
  }

  function syncNav() {
    root.querySelectorAll<HTMLButtonElement>('.jnana-r__nav button').forEach((b, i) => {
      const active = i % chapters.length === chapter
      b.classList.toggle('is-active', active)
      b.setAttribute('aria-current', active ? 'true' : 'false')
    })
  }

  /**
   * CSS multicol lays overflow columns in a row with gaps between every column.
   * One viewport is `clientWidth`, but the next set starts after an extra gap —
   * so the page stride is `clientWidth + columnGap`, not `clientWidth`.
   */
  function layoutMetrics() {
    const styles = getComputedStyle(columns)
    const gap = Number.parseFloat(styles.columnGap) || 0
    const width = columns.clientWidth || 1
    return {
      gap,
      width,
      stride: Math.max(1, width + gap),
    }
  }

  function applyOffset() {
    columns.scrollLeft = Math.round(spreadIndex * pageStride)
  }

  function syncChrome() {
    const oneCol = window.matchMedia('(max-width: 900px)').matches
    const atEnd = chapter === chapters.length - 1 && spreadIndex === spreadCount - 1
    if (position) {
      position.textContent = `Section ${chapter + 1} / ${chapters.length} · ${
        oneCol ? 'Page' : 'Spread'
      } ${spreadIndex + 1} / ${spreadCount}`
    }
    if (prevBtn) prevBtn.disabled = chapter === 0 && spreadIndex === 0
    if (nextBtn) {
      nextBtn.disabled = atEnd && !endLink
      nextBtn.textContent = atEnd && endLink ? 'Next day →' : 'Next →'
    }
    if (progress) {
      const pct = ((chapter + (spreadIndex + 1) / spreadCount) / chapters.length) * 100
      progress.style.width = `${Math.min(100, Math.max(2, pct))}%`
    }
    endLink?.classList.toggle('is-visible', Boolean(atEnd && endLink.href))
  }

  function render() {
    const c = chapters[chapter]
    if (!c) return
    if (heading) heading.textContent = c.title
    if (timeEl) timeEl.textContent = `~${c.minutes} min`
    columns.scrollLeft = 0
    columns.innerHTML = ''
    const title = document.createElement('h2')
    title.className = 'jnana-r__section-title'
    title.textContent = c.title
    columns.append(title)
    for (const para of c.paras) {
      const p = document.createElement('p')
      p.textContent = para
      columns.append(p)
    }
    syncNav()
    requestAnimationFrame(() => requestAnimationFrame(measure))
  }

  function measure() {
    const { gap, stride } = layoutMetrics()
    pageStride = stride
    const total = Math.max(stride, columns.scrollWidth)
    spreadCount = Math.max(1, Math.ceil((total + gap) / stride - 0.001))

    if (spreadIndex >= 9990) spreadIndex = spreadCount - 1
    spreadIndex = Math.min(Math.max(0, spreadIndex), spreadCount - 1)
    applyOffset()
    syncChrome()
  }

  function move(dir: 1 | -1) {
    if (dir === 1) {
      if (spreadIndex < spreadCount - 1) {
        spreadIndex++
      } else if (chapter < chapters.length - 1) {
        chapter++
        spreadIndex = 0
        render()
        return
      } else if (endLink?.href) {
        window.location.href = endLink.href
        return
      } else {
        return
      }
    } else if (spreadIndex > 0) {
      spreadIndex--
    } else if (chapter > 0) {
      chapter--
      spreadIndex = 9999
      render()
      return
    } else {
      return
    }
    applyOffset()
    syncChrome()
  }

  makeNav(nav)
  makeNav(mobileNav)
  prevBtn?.addEventListener('click', () => move(-1))
  nextBtn?.addEventListener('click', () => move(1))
  fontBtn?.addEventListener('click', () => {
    root.classList.toggle('is-font-large')
    spreadIndex = 0
    requestAnimationFrame(() => requestAnimationFrame(measure))
  })
  menuBtn?.addEventListener('click', () => {
    const open = mobileSide?.classList.toggle('is-open')
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false')
  })
  window.addEventListener('resize', () => {
    spreadIndex = 0
    requestAnimationFrame(() => requestAnimationFrame(measure))
  })
  document.addEventListener('keydown', (e) => {
    const tag = (e.target as HTMLElement | null)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault()
      move(1)
    }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault()
      move(-1)
    }
  })

  const fontsReady = document.fonts?.ready
  if (fontsReady) {
    void fontsReady.then(() => measure())
  }

  render()
}
