import { useCallback, useState } from 'react'

export interface View {
  x: number
  y: number
  k: number
}

const MIN_K = 0.35
const MAX_K = 2.6

const clampK = (k: number) => Math.max(MIN_K, Math.min(MAX_K, k))

/** Pan/zoom transform state for the graph canvas. */
export function useView() {
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 })

  const panBy = useCallback((dx: number, dy: number) => {
    setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }))
  }, [])

  /** Zoom by `factor`, keeping the point (px, py) in screen space fixed. */
  const zoomAt = useCallback((factor: number, px: number, py: number) => {
    setView((v) => {
      const k = clampK(v.k * factor)
      const ratio = k / v.k
      return { k, x: px - (px - v.x) * ratio, y: py - (py - v.y) * ratio }
    })
  }, [])

  const reset = useCallback(() => setView({ x: 0, y: 0, k: 1 }), [])

  return { view, panBy, zoomAt, reset }
}
