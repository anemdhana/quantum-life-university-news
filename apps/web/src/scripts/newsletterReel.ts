/** Vertical snap reel: dots, section jump, keyboard ↑↓ */

export function initNewsletterReel(root: HTMLElement) {
  const scroller =
    root.querySelector<HTMLElement>('[data-news-scroll]') ||
    root.querySelector<HTMLElement>('.nreel__scroll')
  if (!scroller) return

  const slides = [...root.querySelectorAll<HTMLElement>('.nreel-slide')]
  const dots = [...root.querySelectorAll<HTMLElement>('[data-reel-dot]')]
  const jumpSelect = root.querySelector<HTMLSelectElement>('[data-reel-jump-select]')
  const jumpChips = [...root.querySelectorAll<HTMLElement>('[data-reel-jump]')]
  if (!slides.length) return

  const setActive = (index: number) => {
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index))
    const slide = slides[index]
    if (!slide) return
    if (jumpSelect && jumpSelect.value !== slide.id) jumpSelect.value = slide.id
    const group = slide.dataset.reelGroup || ''
    jumpChips.forEach((btn) => {
      const target = root.querySelector<HTMLElement>(
        `#${CSS.escape(btn.getAttribute('data-reel-jump') || '')}`,
      )
      const g = target?.dataset.reelGroup || ''
      btn.classList.toggle('is-active', Boolean(group) && g === group)
    })
  }

  const goTo = (index: number) => {
    const i = Math.max(0, Math.min(slides.length - 1, index))
    const target = slides[i]
    if (!target) return
    scroller.scrollTo({ top: target.offsetTop, behavior: 'smooth' })
    setActive(i)
  }

  const goToId = (id: string) => {
    const i = slides.findIndex((el) => el.id === id)
    if (i >= 0) goTo(i)
  }

  if ('IntersectionObserver' in window) {
    const visible = new Map<Element, number>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target, entry.intersectionRatio)
          else visible.delete(entry.target)
        }
        let best = 0
        let bestR = -1
        slides.forEach((el, i) => {
          const r = visible.get(el) || 0
          if (r > bestR) {
            bestR = r
            best = i
          }
        })
        if (bestR > 0) setActive(best)
      },
      { root: scroller, threshold: [0.35, 0.55, 0.75] },
    )
    slides.forEach((el) => io.observe(el))
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      goTo(Number(dot.getAttribute('data-reel-dot') || '0'))
    })
  })

  jumpChips.forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-reel-jump')
      if (id) goToId(id)
    })
  })

  jumpSelect?.addEventListener('change', () => {
    if (jumpSelect.value) goToId(jumpSelect.value)
  })

  root.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'PageDown' && e.key !== 'PageUp') {
      return
    }
    if ((e.target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable]')) {
      return
    }
    const active = dots.findIndex((d) => d.classList.contains('is-active'))
    const cur = active >= 0 ? active : 0
    e.preventDefault()
    goTo(e.key === 'ArrowDown' || e.key === 'PageDown' ? cur + 1 : cur - 1)
  })

  if (!root.hasAttribute('tabindex')) root.setAttribute('tabindex', '0')
  setActive(0)
}
