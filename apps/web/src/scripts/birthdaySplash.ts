/** Birthday Sahasrara pyramid splash — Nov 24, with temporary force for testing. */

/** Set false after testing; date gate (24 Nov) remains. */
export const BIRTHDAY_OVERLAY_FORCE = false

const STORAGE_PREFIX = 'qlu-birthday-'

function todayKey(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${STORAGE_PREFIX}${y}-${m}-${day}`
}

function isNov24(now = new Date()): boolean {
  return now.getMonth() === 10 && now.getDate() === 24
}

function forceFromQuery(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('birthday') === '1'
  } catch {
    return false
  }
}

function shouldShow(): boolean {
  const forced = BIRTHDAY_OVERLAY_FORCE || forceFromQuery()
  if (!forced && !isNov24()) return false
  if (forceFromQuery()) return true
  try {
    if (localStorage.getItem(todayKey()) === '1') return false
  } catch {
    /* ignore */
  }
  return true
}

function markSeen(): void {
  try {
    localStorage.setItem(todayKey(), '1')
  } catch {
    /* ignore */
  }
}

function spawnPour(root: HTMLElement) {
  const layer = root.querySelector<HTMLElement>('[data-birthday-pour]')
  if (!layer) return

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce) return

  const wishes = (root.dataset.wishBits || '').split('|').filter(Boolean)
  const flowers = (root.dataset.flowerBits || '🌸|🌺|🌼|❀').split('|').filter(Boolean)

  const items: Array<{ text: string; kind: 'wish' | 'flower' }> = []
  // Two waves of blessing lines so they keep flowering while the splash is open.
  for (let copy = 0; copy < 2; copy++) {
    for (const wish of wishes) {
      items.push({ text: wish, kind: 'wish' })
    }
  }
  for (let i = 0; i < 10; i++) {
    items.push({ text: flowers[i % flowers.length] || '🌸', kind: 'flower' })
  }

  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = items[i]!
    items[i] = items[j]!
    items[j] = tmp
  }

  items.forEach((item, i) => {
    const fromLeft = i % 2 === 0
    const side = fromLeft ? 'left' : 'right'
    const el = document.createElement('span')
    el.className =
      item.kind === 'wish'
        ? `birthday-splash__flake birthday-splash__flake--wish birthday-splash__flake--${side}`
        : `birthday-splash__flake birthday-splash__flake--flower birthday-splash__flake--${side}`
    el.textContent = item.text
    el.style.animationDelay = `${i * 0.55 + Math.random() * 0.45}s`
    el.style.animationDuration = `${8.5 + Math.random() * 3.5}s`
    el.style.animationName = fromLeft ? 'birthday-side-left' : 'birthday-side-right'
    // Flank the photo: close enough, but not under the portrait.
    if (fromLeft) {
      el.style.left = `${4 + Math.random() * 7}%`
      el.style.right = 'auto'
    } else {
      el.style.right = `${4 + Math.random() * 7}%`
      el.style.left = 'auto'
    }
    if (item.kind === 'flower') {
      el.style.fontSize = `${1.35 + Math.random() * 0.75}rem`
    }
    layer.appendChild(el)
  })
}

export function initBirthdaySplash(root: HTMLElement) {
  if (!shouldShow()) {
    root.hidden = true
    root.setAttribute('aria-hidden', 'true')
    return
  }

  root.hidden = false
  root.setAttribute('aria-hidden', 'false')
  document.documentElement.classList.add('birthday-splash-open')
  spawnPour(root)

  const dismiss = () => {
    if (root.classList.contains('is-leaving')) return
    root.classList.add('is-leaving')
    markSeen()
    window.setTimeout(() => {
      root.hidden = true
      root.setAttribute('aria-hidden', 'true')
      document.documentElement.classList.remove('birthday-splash-open')
      root.remove()
    }, 420)
  }

  root.querySelectorAll<HTMLElement>('[data-birthday-dismiss]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      dismiss()
    })
  })

  root.addEventListener('click', (e) => {
    if (e.target === root) dismiss()
  })

  window.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        dismiss()
      }
    },
    { once: true },
  )
}
