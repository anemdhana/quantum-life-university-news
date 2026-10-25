/** Landscape newsletter flipbook — prev/next, keyboard, edge click, reduced-motion safe. */

export function initFlipbook(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>('[data-flip-stage]')
  const pages = Array.from(root.querySelectorAll<HTMLElement>('[data-flip-page]'))
  const label = root.querySelector<HTMLElement>('[data-flip-label]')
  const prevBtns = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-flip-prev]'))
  const nextBtns = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-flip-next]'))
  const dots = root.querySelector<HTMLElement>('[data-flip-dots]')
  const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-flip-goto]'))

  if (!stage || pages.length === 0) return

  let index = 0
  let busy = false
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  function renderDots() {
    if (!dots) return
    dots.innerHTML = ''
    pages.forEach((_, i) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'flip-dot' + (i === index ? ' is-active' : '')
      b.setAttribute('aria-label', `Page ${i + 1}`)
      b.addEventListener('click', () => go(i))
      dots.appendChild(b)
    })
  }

  function syncChips() {
    chips.forEach((chip) => {
      const i = Number(chip.dataset.flipGoto)
      chip.classList.toggle('is-active', i === index)
      chip.setAttribute('aria-current', i === index ? 'true' : 'false')
    })
  }

  function sync() {
    pages.forEach((page, i) => {
      page.classList.toggle('is-current', i === index)
      page.classList.toggle('is-passed', i < index)
      page.classList.toggle('is-ahead', i > index)
      page.setAttribute('aria-hidden', i === index ? 'false' : 'true')
      if (i === index) page.removeAttribute('inert')
      else page.setAttribute('inert', '')
    })
    if (label) label.textContent = `${index + 1} / ${pages.length}`
    prevBtns.forEach((b) => {
      b.disabled = index <= 0 || busy
    })
    nextBtns.forEach((b) => {
      b.disabled = index >= pages.length - 1 || busy
    })
    renderDots()
    syncChips()
    root.dataset.page = String(index)
  }

  function go(next: number) {
    if (busy) return
    const clamped = Math.max(0, Math.min(pages.length - 1, next))
    if (clamped === index) return

    const forward = clamped > index
    const from = pages[index]
    const to = pages[clamped]

    if (reduceMotion) {
      index = clamped
      sync()
      return
    }

    busy = true
    root.classList.add(forward ? 'is-flip-forward' : 'is-flip-back')
    from.classList.add(forward ? 'is-exit-forward' : 'is-exit-back')
    to.classList.add(forward ? 'is-enter-forward' : 'is-enter-back')
    to.classList.add('is-current')

    window.setTimeout(() => {
      from.classList.remove('is-exit-forward', 'is-exit-back', 'is-current')
      to.classList.remove('is-enter-forward', 'is-enter-back')
      root.classList.remove('is-flip-forward', 'is-flip-back')
      index = clamped
      busy = false
      sync()
    }, 520)
  }

  prevBtns.forEach((b) => b.addEventListener('click', () => go(index - 1)))
  nextBtns.forEach((b) => b.addEventListener('click', () => go(index + 1)))
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const i = Number(chip.dataset.flipGoto)
      if (Number.isFinite(i)) go(i)
    })
  })

  stage.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    if (t.closest('a, button')) return
    const rect = stage.getBoundingClientRect()
    const x = e.clientX - rect.left
    if (x < rect.width * 0.28) go(index - 1)
    else if (x > rect.width * 0.72) go(index + 1)
  })

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault()
      go(index - 1)
    }
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      if ((e.target as HTMLElement)?.closest('input, textarea, a')) return
      e.preventDefault()
      go(index + 1)
    }
  })

  let touchX = 0
  stage.addEventListener(
    'touchstart',
    (e) => {
      touchX = e.changedTouches[0]?.clientX ?? 0
    },
    { passive: true },
  )
  stage.addEventListener(
    'touchend',
    (e) => {
      const x = e.changedTouches[0]?.clientX ?? 0
      const dx = x - touchX
      if (Math.abs(dx) < 48) return
      if (dx > 0) go(index - 1)
      else go(index + 1)
    },
    { passive: true },
  )

  sync()
}
