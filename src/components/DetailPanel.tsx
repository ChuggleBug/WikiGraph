import { useEffect, useRef, useState } from "react";
import type { GraphNode } from "../types";
import {
    CheckIcon,
    ChevronDownIcon,
    ExternalIcon,
    PlusIcon,
    SpinnerIcon,
    ArrowRightIcon,
    TrashIcon,
    PathIcon,
} from "./icons";
import CloseIcon from "@mui/icons-material/Close";
import titleTransform from "../titleTransform";

export interface DetailPanelProps {
    open: boolean;
    node: GraphNode;
    nodeIds: Set<string>;
    pendingTitles: Set<string>;
    loadingAll: boolean;
    onAdd: (title: string) => void;
    onDelete: (title: string) => void;
    onSelectExisting: (title: string) => void;
    onPathModeToggle: () => void;
    onLoadAll: () => void;
    onClose: () => void;
}

const wikiUrl = (title: string) =>
    `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

export interface LinkRowProps {
    title: string;
    here: boolean;
    pending: boolean;
    onAdd: (title: string) => void;
    onSelectExisting: (title: string) => void;
}

function LinkRow({
    title,
    here,
    pending,
    onAdd,
    onSelectExisting,
}: LinkRowProps) {
    const [hovered, setHovered] = useState(false);
    return (
        <button
            className={`wg-lk-row${here ? " wg-lk-row--on" : ""}`}
            disabled={pending}
            onClick={() => (here ? onSelectExisting(title) : onAdd(title))}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <span className="wg-lk-name">{titleTransform(title)}</span>
            {pending ? (
                <span className="wg-lk-add">
                    <SpinnerIcon size={12} />
                </span>
            ) : here ? (
                <span className="wg-lk-on" title="on canvas">
                    {hovered ? (
                        <ArrowRightIcon size={12} />
                    ) : (
                        <CheckIcon size={12} />
                    )}
                </span>
            ) : (
                <span className="wg-lk-add" title="add to canvas">
                    <PlusIcon size={12} />
                </span>
            )}
        </button>
    );
}

export function DetailPanel({
    open,
    node,
    nodeIds,
    pendingTitles,
    loadingAll,
    onAdd,
    onDelete,
    onSelectExisting,
    onPathModeToggle,
    onLoadAll,
    onClose,
}: DetailPanelProps) {
    const [expanded, setExpanded] = useState(true);

    const onCanvas = node.links.filter((l) => nodeIds.has(l)).length;
    const hiddenCount = node.outboundCount - node.links.length;

    useEffect(() => {
        window.addEventListener("keydown", handleKeydown);
        return () => {
            window.removeEventListener("keydown", handleKeydown);
        };
    });

    const handleKeydown = (e: KeyboardEvent) => {
        if (!panelRef.current) {
            return;
        }

        if (
            (e.ctrlKey || e.metaKey) &&
            (e.key === "Delete" || e.key === "Backspace")
        ) {
            onDelete(node.title);
        }
    };

    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!panelRef.current) {
            return;
        }

        window.addEventListener("keydown", handleKeydown);
        return () => {
            window.addEventListener("keydown", handleKeydown);
        };
    }, [panelRef.current]);

    return (
        <>
            {/* Debug status */}
            {/* <div style={{ position: "fixed" }}>
                Detail Panel Open: {JSON.stringify({ open })}
            </div> */}
            <div
                ref={panelRef}
                className={`wg-panel wg-dp ${open ? "wg-dp--open" : ""}`}
            >
                <button
                    className="wg-dp-close-btn"
                    onClick={onClose}
                    aria-label="Close panel"
                >
                    <CloseIcon sx={{ fontSize: 24 }} />
                </button>

                <h2 className="wg-serif">{titleTransform(node.title)}</h2>

                <div className="wg-dp-divider" />

                <div className="wg-dp-stat">
                    <span className="n">{node.outboundCount}</span>
                    <span className="u">Outbound links</span>
                    <button
                        className="wg-dp-toggle"
                        aria-expanded={expanded}
                        onClick={() => setExpanded((v) => !v)}
                    >
                        {expanded ? "Hide list" : "Show list"}
                        <ChevronDownIcon size={12} />
                    </button>
                    <button
                        className="wg-dp-path"
                        aria-label="Find path"
                        title="Find path"
                        onClick={onPathModeToggle}
                    >
                        <PathIcon size={14} />
                    </button>
                </div>

                {expanded && (
                    <div className="wg-lk">
                        <div className="wg-kicker">Linked articles</div>
                        <div className="wg-lk-list">
                            <div className="wg-lk-scroll">
                                {node.links.sort().map((title) => (
                                    <LinkRow
                                        key={title}
                                        title={title}
                                        here={nodeIds.has(title)}
                                        pending={pendingTitles.has(title)}
                                        onAdd={onAdd}
                                        onSelectExisting={onSelectExisting}
                                    />
                                ))}
                            </div>
                            <div className="wg-lk-foot">
                                <span>{onCanvas} on canvas</span>
                                <span>
                                    {node.links.length - onCanvas} not yet
                                </span>
                                {hiddenCount > 0 &&
                                    (loadingAll ? (
                                        <span>loading…</span>
                                    ) : (
                                        <button onClick={onLoadAll}>
                                            show all {node.outboundCount}
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="wg-dp-actions">
                    <a
                        className="wg-navigate-btn"
                        href={wikiUrl(node.title)}
                        target="_blank"
                        rel="noreferrer"
                    >
                        Open on Wikipedia
                        <ExternalIcon size={13} />
                    </a>
                    <button
                        className="wg-icbtn wg-icbtn--danger"
                        onClick={() => onDelete(node.id)}
                        aria-label="Delete selected node"
                    >
                        <TrashIcon size={24} />
                    </button>
                </div>
            </div>
        </>
    );
}
