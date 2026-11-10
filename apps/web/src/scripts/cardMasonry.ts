/**
 * Left-to-right masonry: place each card (in DOM order) into the shortest column.
 * Top row reads 1 → 2 → 3; later cards fill gaps under shorter neighbors.
 */

const DEFAULT_MIN_COL = 192
const DEFAULT_GAP = 14

function prefersNativeGridLanes(): boolean {
  try {
    return typeof CSS !== 'undefined' && CSS.supports('display', 'grid-lanes')
  } catch {
    return false
  }
}

function gapPx(el: HTMLElement): number {
  const raw = getComputedStyle(el).columnGap || getComputedStyle(el).gap || ''
  const n = parseFloat(raw)
  return Number.isFinite(n) ? n : DEFAULT_GAP
}

function minColPx(el: HTMLElement): number {
  const raw = el.dataset.masonryMin || ''
  const n = parseFloat(raw)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MIN_COL
}

function layout(container: HTMLElement): void {
  if (prefersNativeGridLanes()) {
    container.classList.add('is-grid-lanes')
    container.classList.remove('is-masonry-laid')
    container.style.removeProperty('height')
    Array.from(container.children).forEach((child) => {
      if (!(child instanceof HTMLElement)) return
      child.style.removeProperty('position')
      child.style.removeProperty('left')
      child.style.removeProperty('top')
      child.style.removeProperty('width')
    })
    return
  }

  const items = Array.from(container.children).filter(
    (c): c is HTMLElement => c instanceof HTMLElement,
  )
  if (!items.length) return

  // Reset so measurements use natural height
  container.classList.remove('is-masonry-laid')
  container.style.height = 'auto'
  for (const item of items) {
    item.style.position = ''
    item.style.left = ''
    item.style.top = ''
    item.style.width = ''
  }

  const width = container.clientWidth
  if (width <= 0) return

  const gap = gapPx(container)
  const minCol = minColPx(container)
  const cols = Math.max(1, Math.floor((width + gap) / (minCol + gap)))
  const colWidth = (width - gap * (cols - 1)) / cols
  const heights = Array.from({ length: cols }, () => 0)

  for (const item of items) {
    let col = 0
    for (let i = 1; i < cols; i++) {
      if (heights[i]! < heights[col]!) col = i
    }
    const left = col * (colWidth + gap)
    const top = heights[col]!
    item.style.position = 'absolute'
    item.style.left = `${left}px`
    item.style.top = `${top}px`
    item.style.width = `${colWidth}px`
    heights[col] = top + item.offsetHeight + gap
  }

  const maxH = Math.max(0, ...heights) - (cols > 0 ? gap : 0)
  container.style.height = `${Math.max(0, maxH)}px`
  container.classList.add('is-masonry-laid')
}

export function initCardMasonry(root: ParentNode = document): void {
  const grids = root.querySelectorAll<HTMLElement>('[data-card-masonry]')
  if (!grids.length) return

  const runAll = () => {
    grids.forEach((grid) => layout(grid))
  }

  runAll()

  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => runAll())
    grids.forEach((grid) => ro.observe(grid))
  } else {
    window.addEventListener('resize', runAll)
  }

  // Images / fonts can change card height after first paint
  grids.forEach((grid) => {
    grid.querySelectorAll('img').forEach((img) => {
      if (img.complete) return
      img.addEventListener('load', runAll, { once: true })
    })
  })

  if (document.fonts?.ready) {
    void document.fonts.ready.then(runAll)
  }
}
