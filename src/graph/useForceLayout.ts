import { useEffect, useMemo, useRef, useState } from 'react'
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
} from 'd3-force'
import type { GraphEdge, GraphNode } from '../types'
import { nodeRadius } from '../types'

export interface SimNode {
  id: string
  r: number
  x: number
  y: number
  vx: number
  vy: number
  fx?: number | null
  fy?: number | null
}

interface SimLink {
  source: string | SimNode
  target: string | SimNode
}

const jitter = () => (Math.random() - 0.5) * 60

/**
 * Runs a d3-force simulation alongside React. React owns node identity (the
 * `nodes`/`edges` props); this hook owns their x/y, published as `positions`
 * state that re-renders on every tick. New nodes are seeded near the canvas
 * centre so they animate outward as forces settle.
 */
export function useForceLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
) {
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null)
  const simNodesRef = useRef(new Map<string, SimNode>())
  const [positions, setPositions] = useState(new Map<string, SimNode>())

  useEffect(() => {
    const sim = forceSimulation<SimNode, SimLink>()
      .force('charge', forceManyBody().strength(-460))
      .force(
        'link',
        forceLink<SimNode, SimLink>()
          .id((d) => d.id)
          .distance(118)
          .strength(0.55),
      )
      .force('collide', forceCollide<SimNode>().radius((d) => d.r + 30))
      .force('x', forceX<SimNode>(0).strength(0.045))
      .force('y', forceY<SimNode>(0).strength(0.045))
      .on('tick', () => setPositions(new Map(simNodesRef.current)))
    simRef.current = sim
    return () => {
      sim.stop()
      simRef.current = null
    }
  }, [])

  useEffect(() => {
    const sim = simRef.current
    if (!sim) return
    ;(sim.force('x') as ReturnType<typeof forceX<SimNode>>).x(width / 2)
    ;(sim.force('y') as ReturnType<typeof forceY<SimNode>>).y(height / 2)
  }, [width, height])

  useEffect(() => {
    const sim = simRef.current
    if (!sim) return
    const prev = simNodesRef.current
    const next = new Map<string, SimNode>()

    const simNodes = nodes.map((n) => {
      const r = nodeRadius(n.outboundCount)
      const existing = prev.get(n.id)
      const sn: SimNode = existing
        ? Object.assign(existing, { r })
        : { id: n.id, r, x: width / 2 + jitter(), y: height / 2 + jitter(), vx: 0, vy: 0 }
      next.set(n.id, sn)
      return sn
    })

    simNodesRef.current = next
    sim.nodes(simNodes)
    ;(sim.force('link') as ReturnType<typeof forceLink<SimNode, SimLink>>).links(
      edges.map((e) => ({ source: e.source, target: e.target })),
    )
    sim.alpha(0.9).restart()
    setPositions(new Map(next))
  }, [nodes, edges, width, height])

  const drag = useMemo(
    () => ({
      start(id: string, x: number, y: number) {
        const node = simNodesRef.current.get(id)
        if (!node) return
        node.fx = x
        node.fy = y
        simRef.current?.alphaTarget(0.3).restart()
      },
      move(id: string, x: number, y: number) {
        const node = simNodesRef.current.get(id)
        if (!node) return
        node.fx = x
        node.fy = y
      },
      end(id: string) {
        const node = simNodesRef.current.get(id)
        if (node) {
          node.fx = null
          node.fy = null
        }
        simRef.current?.alphaTarget(0)
      },
    }),
    [],
  )

  return { positions, drag }
}
