/** NewsView: expand story cards + keyword filter (Canva-style shell). */

function openNewsCard(card: HTMLElement) {
  const toggle = card.querySelector<HTMLButtonElement>('[data-news-toggle]')
  const panel = card.querySelector<HTMLElement>('[data-news-panel]')
  if (!toggle || !panel) return
  const closeLabel = toggle.dataset.closeLabel || 'Close'
  card.classList.add('is-open')
  toggle.setAttribute('aria-expanded', 'true')
  toggle.textContent = closeLabel
  panel.hidden = false
}

/** Expand parent card (if any) and scroll to #story-… after returning from full story. */
function restoreStoryAnchor(root: HTMLElement) {
  const id = decodeURIComponent((window.location.hash || '').replace(/^#/, ''))
  if (!id.startsWith('story-')) return
  const target = root.querySelector<HTMLElement>(`#${CSS.escape(id)}`)
  if (!target) return

  const card = target.closest<HTMLElement>('[data-news-card]')
  if (card) openNewsCard(card)

  // Wait a frame so the panel is visible before scrolling.
  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

export function initNewsView(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('[data-news-card]').forEach((card) => {
    const toggle = card.querySelector<HTMLButtonElement>('[data-news-toggle]')
    const panel = card.querySelector<HTMLElement>('[data-news-panel]')
    if (!toggle || !panel) return

    const openLabel = toggle.dataset.openLabel || 'Read fully >>'
    const closeLabel = toggle.dataset.closeLabel || 'Close'

    toggle.addEventListener('click', () => {
      const open = card.classList.toggle('is-open')
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false')
      toggle.textContent = open ? closeLabel : openLabel
      if (open) {
        panel.hidden = false
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      } else {
        panel.hidden = true
      }
    })
  })

  const form = root.querySelector<HTMLFormElement>('[data-news-search]')
  const qInput = root.querySelector<HTMLInputElement>('[data-news-q]')
  const monthSelect = root.querySelector<HTMLSelectElement>('[data-news-month]')
  const items = [...root.querySelectorAll<HTMLElement>('[data-news-item]')]

  const applyFilter = () => {
    const q = (qInput?.value || '').trim().toLowerCase()
    items.forEach((el) => {
      const hay = (el.dataset.search || el.textContent || '').toLowerCase()
      el.hidden = q.length > 0 && !hay.includes(q)
    })
  }

  form?.addEventListener('submit', (e) => {
    e.preventDefault()
    if (monthSelect?.value === 'archive') {
      window.location.href = '/issues/'
      return
    }
    applyFilter()
  })

  qInput?.addEventListener('input', () => {
    if (!(qInput.value || '').trim()) {
      items.forEach((el) => {
        el.hidden = false
      })
    }
  })

  restoreStoryAnchor(root)
  window.addEventListener('hashchange', () => restoreStoryAnchor(root))
}
