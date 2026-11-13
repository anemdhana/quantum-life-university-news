/** Full-story reader: scroll progress (same shell as news view). */

export function initStoryView(root: HTMLElement) {
  const scroller = root.querySelector<HTMLElement>('[data-story-scroll]')
  const progress = root.querySelector<HTMLElement>('[data-story-progress]')

  const updateProgress = () => {
    if (!scroller || !progress) return
    const max = scroller.scrollHeight - scroller.clientHeight
    const pct = max > 0 ? Math.min(100, Math.max(2, (scroller.scrollTop / max) * 100)) : 2
    progress.style.width = `${pct}%`
  }

  scroller?.addEventListener('scroll', updateProgress, { passive: true })
  window.addEventListener('resize', updateProgress, { passive: true })
  updateProgress()
}
