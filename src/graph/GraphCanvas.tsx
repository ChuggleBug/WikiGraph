import { useEffect, useRef, useState } from "react";
import type { GraphEdge, GraphNode } from "../types";
import { useForceLayout } from "./useForceLayout";
import type { View } from "./useView";
import titleTransform from "../titleTransform";

export interface GraphCanvasProps {
    nodes: GraphNode[];
    edges: GraphEdge[];
    selectedId: string | null;
    view: View;
    onPanBy: (dx: number, dy: number) => void;
    onZoomAt: (factor: number, px: number, py: number) => void;
    onSelectNode: (id: string) => void;
    onBackgroundClick: () => void;
    /** When true, one-finger drags neither pan the canvas nor move nodes; taps and pinch-zoom still work. */
    dragLocked?: boolean;
}

const DRAG_THRESHOLD = 3;

export function GraphCanvas({
    nodes,
    edges,
    selectedId,
    view,
    onPanBy,
    onZoomAt,
    onSelectNode,
    onBackgroundClick,
    dragLocked = false,
}: GraphCanvasProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [size, setSize] = useState<{ width: number; height: number } | null>(
        null,
    );
    const [grabbing, setGrabbing] = useState(false);
    const { positions, drag } = useForceLayout(
        size ? nodes : [],
        size ? edges : [],
        size?.width ?? 0,
        size?.height ?? 0,
    );

    useEffect(() => {
        const el = svgRef.current;
        if (!el) {
            return;
        }
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setSize({ width, height });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const pan = useRef({ active: false, moved: false, x: 0, y: 0 });
    const nodeDrag = useRef<{
        id: string;
        moved: boolean;
        started: boolean;
        startX: number;
        startY: number;
        offX: number;
        offY: number;
    } | null>(null);

    const toGraph = (clientX: number, clientY: number) => {
        const rect = svgRef.current!.getBoundingClientRect();
        return {
            x: (clientX - rect.left - view.x) / view.k,
            y: (clientY - rect.top - view.y) / view.k,
        };
    };

    // Active pointers, tracked in the capture phase so pinches work over nodes too.
    const pointers = useRef(new Map<number, { x: number; y: number }>());
    // True from the moment a second finger lands until every finger lifts.
    const pinching = useRef(false);

    const pinchMetrics = () => {
        const [a, b] = [...pointers.current.values()];
        return {
            dist: Math.hypot(b.x - a.x, b.y - a.y),
            midX: (a.x + b.x) / 2,
            midY: (a.y + b.y) / 2,
        };
    };

    const onPointerDownCapture = (e: React.PointerEvent) => {
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.current.size === 2) {
            pinching.current = true;
            // Abandon any single-pointer gesture in progress.
            pan.current.active = false;
            setGrabbing(false);
            const d = nodeDrag.current;
            if (d?.started) {
                drag.end(d.id);
            }
            nodeDrag.current = null;
        }
    };
    const onPointerMoveCapture = (e: React.PointerEvent) => {
        if (!pointers.current.has(e.pointerId)) {
            return;
        }
        if (!pinching.current || pointers.current.size !== 2) {
            pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
            return;
        }
        const before = pinchMetrics();
        pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const after = pinchMetrics();
        const rect = svgRef.current!.getBoundingClientRect();
        onPanBy(after.midX - before.midX, after.midY - before.midY);
        if (before.dist > 0) {
            onZoomAt(
                after.dist / before.dist,
                after.midX - rect.left,
                after.midY - rect.top,
            );
        }
    };
    const onPointerEndCapture = (e: React.PointerEvent) => {
        pointers.current.delete(e.pointerId);
        if (pointers.current.size === 0) {
            // Defer so bubble-phase up handlers still see the pinch and skip click logic.
            queueMicrotask(() => {
                if (pointers.current.size === 0) {
                    pinching.current = false;
                }
            });
        }
    };

    const onBgPointerDown = (e: React.PointerEvent) => {
        if (pinching.current) {
            return;
        }
        pan.current = {
            active: true,
            moved: false,
            x: e.clientX,
            y: e.clientY,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
        if (!dragLocked) {
            setGrabbing(true);
        }
    };
    const onBgPointerMove = (e: React.PointerEvent) => {
        if (!pan.current.active) {
            return;
        }
        const dx = e.clientX - pan.current.x;
        const dy = e.clientY - pan.current.y;
        if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
            pan.current.moved = true;
        }
        if (dragLocked) {
            // Only track distance so a drag isn't treated as a tap.
            return;
        }
        pan.current.x = e.clientX;
        pan.current.y = e.clientY;
        onPanBy(dx, dy);
    };
    const onBgPointerUp = (e: React.PointerEvent) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        if (pan.current.active && !pan.current.moved) {
            onBackgroundClick();
        }
        pan.current.active = false;
        setGrabbing(false);
    };

    const onNodePointerDown = (e: React.PointerEvent, id: string) => {
        e.stopPropagation();
        if (pinching.current) {
            return;
        }
        const p = toGraph(e.clientX, e.clientY);
        const c = positions.get(id);
        nodeDrag.current = {
            id,
            moved: false,
            started: false,
            startX: e.clientX,
            startY: e.clientY,
            offX: c ? c.x - p.x : 0,
            offY: c ? c.y - p.y : 0,
        };
        (e.target as Element).setPointerCapture(e.pointerId);
    };
    const onNodePointerMove = (e: React.PointerEvent) => {
        const d = nodeDrag.current;
        if (!d) {
            return;
        }
        const p = toGraph(e.clientX, e.clientY);
        if (!d.moved) {
            if (
                Math.hypot(e.clientX - d.startX, e.clientY - d.startY) <=
                DRAG_THRESHOLD
            ) {
                return;
            }
            d.moved = true;
            if (!dragLocked) {
                d.started = true;
                drag.start(d.id, p.x + d.offX, p.y + d.offY);
            }
            return;
        }
        if (!d.started) {
            return;
        }
        drag.move(d.id, p.x + d.offX, p.y + d.offY);
    };
    const onNodePointerUp = (e: React.PointerEvent) => {
        const d = nodeDrag.current;
        if (!d) {
            return;
        }
        (e.target as Element).releasePointerCapture(e.pointerId);
        if (d.started) {
            drag.end(d.id);
        } else if (!d.moved) {
            onSelectNode(d.id);
        }
        nodeDrag.current = null;
    };

    const onWheel = (e: React.WheelEvent) => {
        const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
        onZoomAt(factor, e.clientX, e.clientY);
    };

    return (
        <svg
            ref={svgRef}
            className={`wg-canvas${grabbing ? " wg-canvas--grabbing" : ""}`}
            onPointerDown={onBgPointerDown}
            onPointerMove={onBgPointerMove}
            onPointerUp={onBgPointerUp}
            onPointerCancel={onBgPointerUp}
            onPointerDownCapture={onPointerDownCapture}
            onPointerMoveCapture={onPointerMoveCapture}
            onPointerUpCapture={onPointerEndCapture}
            onPointerCancelCapture={onPointerEndCapture}
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
                        const s = positions.get(edge.source);
                        const t = positions.get(edge.target);
                        if (!s || !t) {
                            return null;
                        }
                        const dx = t.x - s.x;
                        const dy = t.y - s.y;
                        const len = Math.hypot(dx, dy) || 1;
                        const ux = dx / len;
                        const uy = dy / len;
                        const nodeSelected =
                            edge.source === selectedId ||
                            edge.target === selectedId;

                        return (
                            <line
                                key={edge.key}
                                className={`${edge.kind === "mutual" ? "wg-edge--mutual" : "wg-edge--directed"} ${nodeSelected ? "wg-edge--selected" : ""}`}
                                x1={s.x + ux * (s.r + 2)}
                                y1={s.y + uy * (s.r + 2)}
                                x2={t.x - ux * (t.r + 2)}
                                y2={t.y - uy * (t.r + 2)}
                            />
                        );
                    })}

                    {nodes.map((node) => {
                        const p = positions.get(node.id);
                        if (!p) {
                            return null;
                        }
                        const selected = node.id === selectedId;
                        return (
                            <g
                                key={node.id}
                                className="wg-node"
                                transform={`translate(${p.x} ${p.y})`}
                                onPointerDown={(e) =>
                                    onNodePointerDown(e, node.id)
                                }
                            >
                                {/* Invisible hit area — enlarges the clickable/draggable target */}
                                <circle r={p.r + 12} fill="transparent" />
                                {selected && (
                                    <>
                                        <circle
                                            r={p.r + 15}
                                            fill="#a23b2e"
                                            fillOpacity={0.12}
                                        />
                                        <circle
                                            r={p.r + 6}
                                            fill="none"
                                            stroke="#a23b2e"
                                            strokeWidth={1.4}
                                        />
                                    </>
                                )}
                                <circle
                                    r={p.r}
                                    fill={selected ? "#a23b2e" : "#2b2620"}
                                />

                                {/* Text displayed on a node in the graph */}
                                <text
                                    className="wg-node-label"
                                    y={p.r + 15}
                                    fill={selected ? "#a23b2e" : undefined}
                                >
                                    {titleTransform(node.title, {
                                        trim: true,
                                        count: 20,
                                    })}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </g>
        </svg>
    );
}
