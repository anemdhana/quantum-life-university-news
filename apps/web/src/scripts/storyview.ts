/** Full-story reader: scroll progress + mobile drawer (news shell). */

export function initStoryView(root: HTMLElement) {
  const scroller = root.querySelector<HTMLElement>('[data-story-scroll]')
  const progress = root.querySelector<HTMLElement>('[data-story-progress]')
  const menuBtn = root.querySelector<HTMLButtonElement>('[data-story-menu]')
  const mobileSide = root.querySelector<HTMLElement>('[data-story-mobile-side]')

  const updateProgress = () => {
    if (!scroller || !progress) return
    const max = scroller.scrollHeight - scroller.clientHeight
    const pct = max > 0 ? Math.min(100, Math.max(2, (scroller.scrollTop / max) * 100)) : 2
    progress.style.width = `${pct}%`
  }

  scroller?.addEventListener('scroll', updateProgress, { passive: true })
  window.addEventListener('resize', updateProgress, { passive: true })
  updateProgress()

  menuBtn?.addEventListener('click', () => {
    const open = mobileSide?.classList.toggle('is-open') ?? false
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false')
  })

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return
    mobileSide?.classList.remove('is-open')
    menuBtn?.setAttribute('aria-expanded', 'false')
  })
}
