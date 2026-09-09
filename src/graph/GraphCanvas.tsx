import { useEffect, useRef, useState } from 'react'
import type { GraphEdge, GraphNode } from '../types'
import { useForceLayout } from './useForceLayout'
import type { View } from './useView'
import titleTransform from '../titleTransform'

interface Props {
  nodes: GraphNode[]
  edges: GraphEdge[]
  selectedId: string | null
  view: View
  onPanBy: (dx: number, dy: number) => void
  onZoomAt: (factor: number, px: number, py: number) => void
  onSelectNode: (id: string) => void
  onBackgroundClick: () => void
}

const DRAG_THRESHOLD = 3

export function GraphCanvas({
  nodes,
  edges,
  selectedId,
  view,
  onPanBy,
  onZoomAt,
  onSelectNode,
  onBackgroundClick,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ width: 20000, height: 900 })
  const [grabbing, setGrabbing] = useState(false)
  const { positions, drag } = useForceLayout(nodes, edges, size.width, size.height)

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const pan = useRef({ active: false, moved: false, x: 0, y: 0 })
  const nodeDrag = useRef<{
    id: string
    moved: boolean
    startX: number
    startY: number
    offX: number
    offY: number
  } | null>(null)

  const toGraph = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect()
    return {
      x: (clientX - rect.left - view.x) / view.k,
      y: (clientY - rect.top - view.y) / view.k,
    }
  }

  const onBgPointerDown = (e: React.PointerEvent) => {
    pan.current = { active: true, moved: false, x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
    setGrabbing(true)
  }
  const onBgPointerMove = (e: React.PointerEvent) => {
    if (!pan.current.active) return
    const dx = e.clientX - pan.current.x
    const dy = e.clientY - pan.current.y
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD) pan.current.moved = true
    pan.current.x = e.clientX
    pan.current.y = e.clientY
    onPanBy(dx, dy)
  }
  const onBgPointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    if (pan.current.active && !pan.current.moved) onBackgroundClick()
    pan.current.active = false
    setGrabbing(false)
  }

  const onNodePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation()
    const p = toGraph(e.clientX, e.clientY)
    const c = positions.get(id)
    nodeDrag.current = {
      id,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      offX: c ? c.x - p.x : 0,
      offY: c ? c.y - p.y : 0,
    }
      ; (e.target as Element).setPointerCapture(e.pointerId)
  }
  const onNodePointerMove = (e: React.PointerEvent) => {
    const d = nodeDrag.current
    if (!d) return
    const p = toGraph(e.clientX, e.clientY)
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) <= DRAG_THRESHOLD) return
      d.moved = true
      drag.start(d.id, p.x + d.offX, p.y + d.offY)
      return
    }
    drag.move(d.id, p.x + d.offX, p.y + d.offY)
  }
  const onNodePointerUp = (e: React.PointerEvent) => {
    const d = nodeDrag.current
    if (!d) return
      ; (e.target as Element).releasePointerCapture(e.pointerId)
    if (d.moved) drag.end(d.id)
    else onSelectNode(d.id)
    nodeDrag.current = null
  }

  const onWheel = (e: React.WheelEvent) => {
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
    onZoomAt(factor, e.clientX, e.clientY)
  }

  return (
    <svg
      ref={svgRef}
      className={`wg-canvas${grabbing ? ' wg-canvas--grabbing' : ''}`}
      onPointerDown={onBgPointerDown}
      onPointerMove={onBgPointerMove}
      onPointerUp={onBgPointerUp}
      onWheel={onWheel}
    >
      <rect x={0} y={0} width="100%" height="100%" fill="transparent" />
      <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
        <g
          fill="none"
          onPointerMove={onNodePointerMove}
          onPointerUp={onNodePointerUp}
        >
          {edges.map((edge) => {
            const s = positions.get(edge.source)
            const t = positions.get(edge.target)
            if (!s || !t) return null
            const dx = t.x - s.x
            const dy = t.y - s.y
            const len = Math.hypot(dx, dy) || 1
            const ux = dx / len
            const uy = dy / len
            return (
              <line
                key={edge.key}
                className={
                  edge.kind === 'mutual' ? 'wg-edge--mutual' : 'wg-edge--directed'
                }
                x1={s.x + ux * (s.r + 2)}
                y1={s.y + uy * (s.r + 2)}
                x2={t.x - ux * (t.r + 2)}
                y2={t.y - uy * (t.r + 2)}
              />
            )
          })}

          {nodes.map((node) => {
            const p = positions.get(node.id)
            if (!p) return null
            const selected = node.id === selectedId
            return (
              <g
                key={node.id}
                className="wg-node"
                transform={`translate(${p.x} ${p.y})`}
                onPointerDown={(e) => onNodePointerDown(e, node.id)}
              >
                {/* Invisible hit area — enlarges the clickable/draggable target */}
                <circle r={p.r + 12} fill="transparent" />
                {selected && (
                  <>
                    <circle r={p.r + 15} fill="#a23b2e" fillOpacity={0.12} />
                    <circle
                      r={p.r + 6}
                      fill="none"
                      stroke="#a23b2e"
                      strokeWidth={1.4}
                    />
                  </>
                )}
                <circle r={p.r} fill={selected ? '#a23b2e' : '#2b2620'} />

                {/* Text displayed on a node in the graph */}
                <text className="wg-node-label" y={p.r + 15} fill={selected ? '#a23b2e' : undefined}>
                  {titleTransform(node.title)}
                </text>
              </g>
            )
          })}
        </g>
      </g>
    </svg>
  )
}
