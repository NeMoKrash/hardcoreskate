import { useCallback, useRef, useState } from 'react'

// A callback ref (not useRef + useEffect) so the observer re-attaches
// whenever the DOM node actually shows up — including elements that only
// mount later, after async data arrives (e.g. a section gated on fetched data).
export function useScrollReveal(threshold = 0.15) {
  const [visible, setVisible] = useState(false)
  const observerRef = useRef(null)

  const ref = useCallback((el) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold }
    )
    observer.observe(el)
    observerRef.current = observer
  }, [threshold])

  return [ref, visible]
}
