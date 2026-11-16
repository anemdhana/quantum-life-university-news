/** In-card image strip: prev/next + scroll-snap */

export function initCardGallery(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-card-gallery]').forEach((gallery) => {
    if (gallery.dataset.galleryReady === '1') return
    const track = gallery.querySelector<HTMLElement>('[data-card-gallery-track]')
    const slides = track
      ? [...track.querySelectorAll<HTMLElement>('[data-card-gallery-slide]')]
      : []
    if (!track || slides.length < 2) return

    gallery.dataset.galleryReady = '1'
    const prev = gallery.querySelector<HTMLButtonElement>('[data-card-gallery-prev]')
    const next = gallery.querySelector<HTMLButtonElement>('[data-card-gallery-next]')
    const dots = [...gallery.querySelectorAll<HTMLElement>('[data-card-gallery-dot]')]

    const setActive = (index: number) => {
      dots.forEach((d, i) => d.classList.toggle('is-active', i === index))
    }

    const goTo = (index: number) => {
      const i = Math.max(0, Math.min(slides.length - 1, index))
      const target = slides[i]
      if (!target) return
      track.scrollTo({ left: target.offsetLeft, behavior: 'smooth' })
      setActive(i)
    }

    const currentIndex = () => {
      const left = track.scrollLeft
      let best = 0
      let bestDist = Infinity
      slides.forEach((el, i) => {
        const d = Math.abs(el.offsetLeft - left)
        if (d < bestDist) {
          bestDist = d
          best = i
        }
      })
      return best
    }

    prev?.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      goTo(currentIndex() - 1)
    })
    next?.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      goTo(currentIndex() + 1)
    })
    dots.forEach((dot, i) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        goTo(i)
      })
    })

    track.addEventListener(
      'scroll',
      () => {
        setActive(currentIndex())
      },
      { passive: true },
    )

    setActive(0)
  })
}
