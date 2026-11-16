import { useEffect, useState } from "react";
import type { GraphNode } from "../types";
import {
    CheckIcon,
    ChevronDownIcon,
    CloseIcon,
    ExternalIcon,
    PlusIcon,
    SpinnerIcon,
    ArrowRightIcon,
    TrashIcon,
} from "./icons";
import titleTransform from "../titleTransform";

interface Props {
    open: boolean;
    node: GraphNode;
    nodeIds: Set<string>;
    pendingTitles: Set<string>;
    loadingAll: boolean;
    onAdd: (title: string) => void;
    onDelete: (title: string) => void;
    onSelectExisting: (title: string) => void;
    onLoadAll: () => void;
    onClose: () => void;
}

const wikiUrl = (title: string) =>
    `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

interface LinkRowProps {
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
    onLoadAll,
    onClose,
}: Props) {
    const [expanded, setExpanded] = useState(true);

    const onCanvas = node.links.filter((l) => nodeIds.has(l)).length;
    const hiddenCount = node.outboundCount - node.links.length;

    const deleteHandler = (e: KeyboardEvent) => {
        if (e.key === "Delete" || e.key === "Backspace") {
            onDelete(node.id);
        }
    };

    useEffect(() => {
        window.addEventListener("keydown", deleteHandler);
        return () => {
            window.removeEventListener("keydown", deleteHandler);
        };
    });

    return (
        <>
            {/* Debug status */}
            {/* <div style={{ position: 'fixed' }}>Detail Panel Open: {`${open}`}</div> */}
            <div className={`wg-panel wg-dp ${open ? "wg-dp--open" : ""}`}>
                <button
                    className="wg-dp-close-btn"
                    onClick={onClose}
                    aria-label="Close panel"
                >
                    <CloseIcon size={15} />
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
